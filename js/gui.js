define(['./git-cmds', 'js/paged-table', './git-data-helper', 'utils/misc_utils', './mime-utils', 'cm/lib/codemirror', 'cm/addon/selection/active-line'], 
    function(git, PagedTable, gitDataHelper, miscUtils, mimeUtils, CodeMirror, CM_shim) {

    //setup Codemirror
    var cmConfig = {
      theme: "midnight",
      readOnly: true,
      styleActiveLine: true,
      //Tab disabled to allow normal browser tabbing to occur b/w CM and commit list 
      extraKeys: { Tab: false }
    };
    
    var currentListTable, commitListTable, branchListTable, treeviewTable; //always start with commit list view
    var myCodeMirror;
    var NUM_COMMIT_LINES = 10;
    var MAX_COMMIT_HIST = 1500;
    var currentContext = [];
    var currentRepoCommits;
        
    currentContext.CONTEXT_CLONING = "cloning";
    currentContext.CONTEXT_ASK_REMOTE = "askForRemote";
    currentContext.CONTEXT_SHOW_COMMIT = "showCommit";
    
    function selectCurrentLine() {
      var currentLine = currentListTable.getCurrentTR();
      var currentSha = currentLine.attr("id");
      console.log("SEL", currentLine);
          
      if (currentListTable == branchListTable) {
          console.log("show specific branch commitlog", currentSha);
          getAndThenShowLog(currentSha);
      } else if (currentListTable == commitListTable) {
          if (!initCM()) {
              $(".CodeMirror").show();
              myCodeMirror.refresh();
          }
          if (currentContext[0] != currentContext.CONTEXT_SHOW_COMMIT) {
              currentContext.push(currentContext.CONTEXT_SHOW_COMMIT);
          }
          git.renderCommit(currentSha, git.getCurrentRepo(), function(commitTxt) {
            console.log("show commit txt in CM...");
            var commit = currentListTable.getData()[currentListTable.getCurrentIndex()];
            var header = gitDataHelper.commitHeader(commit);
            loadIntoCM(header+commitTxt, "commit.diff");
          });
      } else if (currentListTable == treeviewTable) {
          if (currentSha === "..") {
             popTree();
          } else {
              if (currentLine.hasClass("dir")) {
                showTree(currentSha);
              } else if (currentLine.hasClass("module")) {
                  showError("TODO: showing submodules in treeview");
              } else {
                  git.getBlobForSha(currentSha, function(blob) {
                      var contents = blob.data;
                      if (blob.data instanceof ArrayBuffer) {
						 contents = new Uint8Array(blob.data);
					  }
                      var fileAsString = miscUtils.bytesToString(contents);
                      if (!initCM()) {
                          $(".CodeMirror").show();
                          myCodeMirror.refresh();
                      }
                      loadIntoCM(fileAsString, currentLine.children(".filename").text());
                  }, function(err) { console.error(err);});

              }
          }
      }
    }
    
    function initCM() {
      if (!myCodeMirror) {
        myCodeMirror = CodeMirror(document.querySelector("#mainContainer"), cmConfig);
        console.log("CM init", myCodeMirror);
        CodeMirror.modeURL = "lib/cm/mode/%N/%N.js"; //make sure real path not AMD alias
        $(".CodeMirror").height("50%");
        $("#commitListContainer").height("50%");
        return true;
      } else {
          console.log("nothing to Init, CM already available");
          return false;
      }
    }
    
    function loadIntoCM(txt, filename) {
        console.log("load into CM "+filename);
        var mode = mimeUtils.guessFileType(txt.substring(0, 80), filename);
        if (mode.name) {
            require(['cm/mode/'+mode.name+"/"+mode.name], function () {
                myCodeMirror.setOption("mode", mode.mime);
                myCodeMirror.getDoc().setValue(txt);    
            });    
        } else {
            myCodeMirror.setOption("mode", mode.mime);
            myCodeMirror.getDoc().setValue(txt);    
        }
    }
    
   function updateStatusBar() {
      var currIdx = currentListTable.getCurrentIndex();
      var size = currentListTable.getData().length;
      var currTr = currentListTable.getCurrentTR();
      if (currentListTable == commitListTable) {
        renderStatusBar([currTr.attr("id"), "-", "commit", currIdx + 1 , "of", size].join(" ")); //+1 because users like to see 1 indexed not zero    
      } else if (currentListTable == branchListTable) {
        renderStatusBar([currTr.attr("id"), "-", "branch", currIdx + 1 , "of", size].join(" ")); //+1 because users like to see 1 indexed not zero    
      } else if (currentListTable == treeviewTable) {
        renderStatusBar([currTr.attr("id"), "-", "file", currIdx + 1 , "of", size].join(" ")); //+1 because users like to see 1 indexed not zero
      }
      else {
          console.error("no match", currentListTable);
      }
    }
    
    function renderStatusBar(str) {
      $("#statusbar").text(str);
    }

    function moveSelLine(direction) {
      if (currentContext[0] == currentContext.CONTEXT_CLONING) {
          showError("cannot navigate - clone in progress");
          return; //no user input while cloning
      }
      var nuLine;
      switch (direction) {
        case "up":
          currentListTable.prev();
        break;
        case "down":
          currentListTable.next();
        break;
        case "home":
          currentListTable.first();
        break;
        case "end":
           currentListTable.last();
        break;
      }
      updateStatusBar();
    }

    function askForRemote() {
        var repoDir;
        
        function progress (a) { 
            //console.log("clone progress", a);
            var str = a.msg + "["+Math.floor(a.pct)+"%]";
            renderStatusBar(str); 
         }
        function completed (a) { 
            console.log("clone COMPLETED!"+a);
            var c = currentContext.pop();
            if (c != currentContext.CONTEXT_CLONING) {
                console.error("cloning was NOT the current context:"+c);
                if (c) { //if its a valid state, put it back
                    currentContext.push(c);    
                }
            }
            git.setOutDir(repoDir);
            renderStatusBar("Clone Completed!");
            $("#remoteOpen").hide();
            getAndThenShowLog();
        }
        
        currentContext.push(currentContext.CONTEXT_SHOW_COMMIT);
        $("#cancelCloneButton").click(cancelCurrentContext);
        
        $("#helpTextMenu").hide(); //hide away help and show clone ui instead
        $("#remoteOpen").show();
        $("#localParentDir").click(function() {
            git.getFS(function(outDir) {
                var url = $("#remoteUrl").val();
                var dirName = gitDataHelper.getRepoNameFromUrl(url);
                console.log("calc name to be", dirName);
                outDir.getDirectory(dirName, {create:true}, function(nuDir){
                    chrome.fileSystem.getWritableEntry(nuDir, function(writableDir) {
                        repoDir = writableDir;
                        chrome.fileSystem.getDisplayPath(writableDir, function (dispPath) {
                            $("#localParentDir").prop("value",dispPath);
                        });
                        console.log("set repoDir", repoDir);
                    });
                });
            });
        });
        $("#cloneButton").click(function() {
            console.log('CLONE!',  $("#remoteUrl"));
            currentContext.pop();
            currentContext.push(currentContext.CONTEXT_CLONING);
            git.cloneRemote( $("#remoteUrl").val(), repoDir, progress, completed, function(err) {
                showError("Error Cloning: "+err);
            });
        });
    }
    
    function showLog(commitList) {
        var config = {
            pageSize: NUM_COMMIT_LINES,
            data: commitList,
            trRenderer: gitDataHelper.renderTRCommitLogLine,
            tableElem:  document.querySelector("#commitList")
        };
        //setup the commitList
        commitListTable = new PagedTable(config);
        currentListTable = commitListTable;
        $("#branchList").hide();
        $("#treeview").hide();
        $("#commitList").show();
        updateStatusBar();
    }
    
    function showBranches() {
        git.getAllBranches(function(headsData) { //headsData is Arr of Objects, each w/ sha and name props
            var config = {
                pageSize: NUM_COMMIT_LINES,
                data: headsData,
                trRenderer: gitDataHelper.renderTRBranchLine,
                tableElem:  document.querySelector("#branchList")
            };
            //setup the commitList
            branchListTable = new PagedTable(config);            
            $("#commitList").hide();
            $("#treeview").hide();
            $("#branchList").show();
            currentListTable = branchListTable;
            updateStatusBar();
            
        }, function(err) { showError(err);});
    }
    
    function showCommits() {
        showLog(currentRepoCommits);
    }
    
    function chooseFSForLocalRepo() {
        if (currentContext[0] == currentContext.CONTEXT_CLONING) {
            showError("cannot open repo while clone in progress");
        }
        git.getFS(function() { getAndThenShowLog(); } );
    }
    
    function getAndThenShowLog(startAtCommit) {
        //show commit log...
        git.getLog(MAX_COMMIT_HIST, startAtCommit, function(commits) {
            $("#remoteOpen").hide(); //hide clone-repo ui in case it was open
            currentRepoCommits = commits;
            showLog(commits);
            git.getHeadNameForSha(startAtCommit, function(headName) {
                if (headName) {
                    currentListTable.setHeader("Commits ["+headName+"]");
                } else {
                    console.log("no head for:"+startAtCommit)
                }
            });
        }, function(n) { 
            renderStatusBar("loading log... "+n+" commits so far");
        });
    }
    
    function cancelCurrentContext() {
        console.log("CXT CANCEL", currentContext);
        switch(currentContext.pop()) {
            case currentContext.CONTEXT_ASK_REMOTE:
                $("#remoteOpen").hide();
                $("#helpTextMenu").show();
            break;
            case currentContext.CONTEXT_SHOW_COMMIT:
                $(".CodeMirror").hide();
            break;
            case currentContext.CONTEXT_CLONING:
                console.log("cancelling clone-in-progress - TODO");
                //TODO
            break;
            default:
                console.error("invalid context cancel");
            return;
        }
    }
    
    function showTreeForCommit() {
        var currentLine = currentListTable.getCurrentTR();
        if (!currentLine) {
               console.error("no currentLine - cannot show tree!");
               return;
        } 
        console.log("show tree:", currentLine.attr("id"));
        git.getCommitForSha(currentLine.attr("id"), function(commit){
			showTree(commit.tree);
		});
    }
    
    function showTree(treeSHA) {
      var treeData = [];
      git.getTreeForSha(treeSHA, function(tree) {        
        var config = {
            pageSize: NUM_COMMIT_LINES,
            data: tree.entries,
            trRenderer: gitDataHelper.renderTRTreeLine,
            tableElem:  document.querySelector("#treeview")
        };  
          
        console.log("got tree for sha:"+treeSHA, tree);
        $("#commitList").hide();
        $("#branchList").hide();
        $("#treeview").show();
        if (currentListTable.parent) {
            //need to add "fake" up-to-parent tree entry to start of list
            config.data.splice(0, 0,
            {
               isBlob: false,
               isSubmodule: false,
               name: "..",
               sha: ".."
            });
        }
        treeviewTable = new PagedTable(config);
        treeviewTable.parent = currentListTable;
        currentListTable = treeviewTable;
        updateStatusBar();    
      }, function(err) { console.error(err);});
    }
    
    function popTree() {
        currentListTable = treeviewTable = currentListTable.parent;
        treeviewTable.redraw(); //redraw table contents
        updateStatusBar();
    }
        
    function showError(str) {
        console.log("show user err:"+str);
        $("#errorbar").text(str);
    }
    
    return {
        moveSelLine: moveSelLine,
        selectCurrentLine: selectCurrentLine,
        askForRemote: askForRemote,
        chooseFSForLocalRepo: chooseFSForLocalRepo,
        cancelCurrentContext: cancelCurrentContext,
        showBranches: showBranches,
        showCommits: showCommits,
        showTreeForCommit: showTreeForCommit
    };
});