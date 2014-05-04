define(['require', 'objectstore/file_repo', 'commands/diff', 'commands/clone', 'commands/lsremote', 
        'commands/checkout', 'commands/branch', 'formats/dircache'], 
    function(require, FileObjectStore, diff, clone, lsremote, 
            checkout, branch, Dircache) {

    var outDir;
    var FS;
    var currentRepo;
    var currentHeadsCache; //cache all the currentRepos Head refs

    function setOutDir(dir) {
        outDir = dir;
    }
    
    function getOutDir() {
        return outDir;
    }

    function getFS(callback) {
        chrome.fileSystem.chooseEntry({ type : "openDirectory" }, function(entry) {
        console.debug("got FS Dir:", entry);
        FS = entry.filesystem;
        chrome.fileSystem.getWritableEntry(entry, function(entry) {
            console.debug("got FS writable:", entry);
            outDir = entry;            
            callback(entry);
        });
      });
    }
    
    
    var fsErrorHandler = function (err) {
      console.log("fs error:", err);
    };
    
    
    function getLog(limit, startAtCommit, callback) {
        console.debug("git store:", FileObjectStore);
        var store = new FileObjectStore(outDir);
        currentRepo = store;
        store.init(function() {
            console.log("loaded git obj store", store);
                if (startAtCommit) {
                     store._getCommitGraph([startAtCommit], limit, function(commitList){
                            callback(commitList);
                     });
                } else {
                    store.getHeadSha(function(headSha) {
                        console.log("got HEAD as:", headSha);
                        console.log("limit to:"+limit);
                        store._getCommitGraph([headSha], limit, function(commitList){
                            callback(commitList);
                        });
                    });
                }
        });
    }
    
    function getAllBranches(callback, errorCB) {
        if (!currentRepo) {
            errorCB("No local repo selected");
        } else {
            currentRepo.getAllHeads(function(heads) {
                currentHeadsCache = [];
                heads.asyncEach(function(head, done, i) {
                   getShaForHead(head, function(sha) {
                         currentHeadsCache[i] = { "name" : heads[i], "sha" : sha };
                         done();
                   }, function(err) {
                       console.error("err getting sha for head for:"+head, err);
                       errorCB("Error getting SHA for at lest 1 HEAD in branch list");
                       done();
                   }); 
                }, function () { callback(currentHeadsCache);});
            }, errorCB);
        }
    }
    
    function renderAsTextCommitLog(commitList, callback) {
        for (var i=0; i < commitList.length; i++) {
            var commit = commitList[i];
            callback("commit "+commit.sha+"\nauthor:"+commit.author.name+" <"+commit.author.email+">\nDate:"+commit.author.date+"\n\n\t"+commit.message+"\n");
        }
    }
    
    function renderCommit(sha, store, callback) {
        console.log("SHOW COMMIT: "+sha);
        store._retrieveObject(sha, 'Commit', function(commit){
            console.log("commit parent1 :", commit.parents[0]);
            if (commit.parents.length > 1) {
                console.error("CANT HANDLE MERGE COMMITS YET");
                return;
            }
            console.log("commit tree sha:", commit.tree);
            store._getTreesFromCommits([commit.parents[0], sha], function(trees) {
                console.log("got commit treeA, treeB",trees[0], trees[1]);     
                diff.recursiveTreeDiff(trees[0], trees[1], null, store, function(pathList) {
                    console.log("RECURSIVE Diff RESULT:", pathList);
                    diff.renderDiff(pathList, store, function(txt) {
                        callback(txt);
                    });
                });
            });
        });
    }
    
    function testDiff() {
        console.debug("git store:", FileObjectStore);
        var store = new FileObjectStore(outDir); 
        store.init(function() {
          console.log("loaded git obj store", store);
          store.getHeadSha(function(headSha) {
            console.log("got HEAD as:", headSha);
            store._retrieveObject(headSha, 'Commit', function(commit){
              console.log("commit parent1 :", commit.parents[0]);
              console.log("commit tree sha:", commit.tree);
              store._getTreesFromCommits([commit.parents[0], headSha], function(trees) {
                console.log("got commit treeA, treeB",trees[0], trees[1]);
                
                diff.recursiveTreeDiff(trees[0], trees[1], null, store, function(pathList) {
                  console.log("RECURSIVE Diff RESULT:", pathList);
                  diff.renderDiff(pathList, store, function(txt) {
                    console.log("DIFF TEXT", txt);
                  });
                });
              });
            });
          });
        });
    }

    function cloneRemote(remoteUrl, localDirEntry, progressCB, completedCB, errorCB) {
          console.log("clone into dir", localDirEntry);          
            var fileStore = new FileObjectStore(localDirEntry);
            var options = {
              dir: localDirEntry,
              objectStore: fileStore,
              url: remoteUrl,
              depth: null,
              progress: progressCB 
            };
            
            fileStore.init( function() {
              console.log("cloning...", options.dir, typeof clone);
                clone(options, function(a) {
                  console.log("clone has completed");
                  completedCB(a);
                }, function(e) {
                    console.error("error Cloning!", e);
                    errorCB(e.msg);
                });
            });
    }
    
    function getCurrentRepo() {
        return currentRepo;
    }
    
    function getShaForHead(headName, callback, error) {
        var refName = "refs/heads/"+headName;
        currentRepo._getHeadForRef(refName, callback, error);
    }
    
    function getTreeForSha(sha, callback, error) {
        currentRepo._retrieveObject(sha, "Tree", callback, error);
    }
    
    function getCommitForSha(sha, callback, error) {
        currentRepo._retrieveObject(sha, 'Commit', callback, error);
    }
    
    function getBlobForSha(sha, callback, error) {
        currentRepo._retrieveObject(sha, 'Blob', callback, error);
    }
        
    function getHeadNameForSha(sha, callback) {        
        if (!currentHeadsCache) {
           getAllBranches(function() {searchCache(sha, callback);} );
        } else {
           searchCache(sha, callback); 
        }
    }
    
    function searchCache(sha, callback) {
        var res;
        for(var i=0; i < currentHeadsCache.length; i++) {
            if (currentHeadsCache[i].sha == sha) {
               res = currentHeadsCache[i].name;
               break;
            }
        }
        callback(res); //nothing found
    }
    
    function lsRemoteRefs(callback, errorCB) {
        currentRepo.getConfig(function(config) {
            console.log("repo conf", config);
            if (config.url) {
                var opts = {
                    url: config.url,
                    store: currentRepo
                };
                lsremote(opts, callback);
            } else {
                errorCB("missing git-html5 config.json in Current Repo");
            }
        });
    }
        
    function checkoutRef(ref, callback, errorCB) {
        var checkoutOptions = {
            ref: ref,
            dir: outDir,
            objectStore: currentRepo
        };
        if (ref.indexOf("remotes/") == 0) {
            console.log("Remote refs are checked out as Detached Heads! "+ref);
            currentRepo._getHeadForRef("refs/"+ref, function(sha) {
                console.log("got sha for "+ref, sha);
                checkoutSha(sha, callback, errorCB);
            }, errorCB);
        } else {
            console.log("checkout existing branch", ref);
            checkout(checkoutOptions, function() {
                console.log("CHECK OUT OK "+ref);
                callback(ref);
            }, errorCB);
        }
    }
    
    function checkoutSha(sha, callback, errorCB) {
        var checkoutOptions = {
            dir: outDir,
            objectStore: currentRepo
        };
        checkoutOptions.sha = sha; 
        checkout(checkoutOptions, callback, errorCB);
    }
    
    /**
     * 
     */
    function makeRef(existingName, nuRef, callback, errorCB) {
        var branchOptions = {
            objectStore: currentRepo,
            branch: nuRef
        };
        console.log("make nu ref to:"+existingName);
        //first check if we have branch name...
        getShaForHead(existingName, function(sha) {
            branchOptions.sha = sha;
            console.log("make nu Ref "+nuRef+" using sha:"+sha);
            branch(branchOptions, callback, errorCB);    
        }, function() {
            //TODO:
            //ok so its not a branchname - check for a full ref...
            
            //otherwise we assume its a valid sha
            console.log("not a branchname, using as sha"+existingName);
            branchOptions.sha = existingName;
            branch(branchOptions, callback, errorCB);
        });
    }
    
    function getDircache(callback, errorCB) {
        currentRepo.getDircache(function(buf) {
            callback(new Dircache(buf));
        }, errorCB);
    }
    
    return {
        cloneRemote: cloneRemote,
        renderCommit: renderCommit,
        getFS: getFS,
        getCurrentRepo: getCurrentRepo,
        getLog: getLog,
        setOutDir: setOutDir,
        getOutDir: getOutDir,
        getAllBranches: getAllBranches,
        getTreeForSha: getTreeForSha,
        getCommitForSha: getCommitForSha,
        getBlobForSha: getBlobForSha,
        getHeadNameForSha: getHeadNameForSha,
        lsRemoteRefs: lsRemoteRefs,
        checkoutRef: checkoutRef,
        checkoutSha: checkoutSha,
        makeRef: makeRef,
        getDircache: getDircache
    };
});