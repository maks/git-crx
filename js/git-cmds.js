define(['require', 'objectstore/file_repo', 'commands/diff', 'git-html5/commands/clone'], function(require, FileObjectStore, diff, clone) {

    var outDir;
    var FS;
    var currentRepo;

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
    
    
    function getLog(limit, callback) {
        console.debug("git store:", FileObjectStore);
        var store = new FileObjectStore(outDir);
        currentRepo = store;
        store.init(function() {
            console.log("loaded git obj store", store);
            store.getHeadSha(function(headSha) {
                console.log("got HEAD as:", headSha);
                console.log("limit to:"+limit);
                store._getCommitGraph([headSha], limit, function(commitList){
                //renderAsTextCommitLog(commitList, function(x) { console.log(x) });
                callback(commitList);
                });
            });
        });
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

    function cloneRemote(remoteUrl, localDirEntry, progressCB, completedCB) {
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
                  console.log("clone has completed", a);
                  completedCB(a);
                }, fsErrorHandler);
            });         
    }
    
    function getCurrentRepo() {
        return currentRepo;
    }
    
    return {
        cloneRemote: cloneRemote,
        renderCommit: renderCommit,
        getFS: getFS,
        getCurrentRepo: getCurrentRepo,
        getLog: getLog
    };
});