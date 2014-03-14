/*jshint multistr:true */

define(['./git-cmds', 'js/hairlip', 'js/paged-table'], function(git, hairlip, pagedTable) {

    //setup Codemirror
    var cmConfig = {
      mode: "text/x-diff",
      theme: "midnight",
      readOnly: true,
      styleActiveLine: true,
      //Tab disabled to allow normal browser tabbing to occur b/w CM and commit list 
      extraKeys: { Tab: false }
    };
    
    var myCodeMirror;
    var NUM_COMMIT_LINES = 10;
    var MAX_COMMIT_HIST = 250;
    var currentContext = [];
    
    currentContext.CONTEXT_CLONING = "cloning";
    currentContext.CONTEXT_ASK_REMOTE = "askForRemote";
    currentContext.CONTEXT_SHOW_COMMIT = "showCommit";
    
    function selectCurrentLine() {
      var currentLine = pagedTable.getCurrentTR();
      console.log("SEL", currentLine);
      if (!initCM()) {
          $(".CodeMirror").show();
          myCodeMirror.refresh();
      }
      if (currentContext[0] != currentContext.CONTEXT_SHOW_COMMIT) {
          currentContext.push(currentContext.CONTEXT_SHOW_COMMIT);
      }
      git.renderCommit(currentLine.attr("id"), git.getCurrentRepo(), function(commitTxt) {
        console.log("show commit txt in CM...");
        var commit = pagedTable.getData()[pagedTable.getCurrentIndex()];
        var header = commitHeader(commit);
        myCodeMirror.getDoc().setValue(header+commitTxt);
      });
    }
    
    function initCM() {
      if (!myCodeMirror) {
        console.log("CM init");
        myCodeMirror = CodeMirror(document.querySelector("#mainContainer"), cmConfig);
        $(".CodeMirror").height("50%");
        $("#commitListContainer").height("50%");
        return true;
      } else {
          console.log("nothing to Init, CM already available");
          return false;
      }
    }
    
   function updateCommitInStatusBar() {
      var currIdx = pagedTable.getCurrentIndex();
      var size = pagedTable.getData().length;
      var currTr = pagedTable.getCurrentTR();
      renderStatusBar([currTr.attr("id"), "-", "commit", currIdx + 1 , "of", size, "[MAX:", MAX_COMMIT_HIST].join(" ")); //+1 because users like to see 1 indexed not zero
    }
    
    function renderStatusBar(str) {
      $("#statusbar").text(str);
    }

    function moveSelLine(direction) {
      if (currentContext[0] == currentContext.CONTEXT_CLONING) {
          showInErrorView("cannot navigate - clone in progress");
          return; //no user input while cloning
      }
      var nuLine;
      switch (direction) {
        case "up":
          pagedTable.prev();
        break;
        case "down":
          pagedTable.next();
        break;
        case "home":
          pagedTable.first();
        break;
        case "end":
           pagedTable.last();
        break;
      }
      updateCommitInStatusBar();
    }

    /**
     * @return html for a TR that represents the given commit
     */
    function renderTRCommitLogLine(commitData) {
        function lineOr70chr(value) {
            var l = value.indexOf('\n');
            return value.trim().substr(0, (l > 0) ? Math.min(l,70) : 70);
        }
        var data = {
            sha: commitData.sha,
            author : commitData.author.name,
            date : commitData.author.date.toDateString(),
            time : commitData.author.date.getHours()+":"+commitData.author.date.getMinutes(),
            mesg : lineOr70chr(commitData.message)
        };
        var trTempl = '<tr id="{{sha}}"> \
            <td class="commitDate">{{date}}</td> \
            <td class="commitTime">{{time}}</td> \
            <td class="commitAuthor">{{author}}</td> \
            <td class="commitType">{{type}}</td> \
            <td class="commitShortMesg"><span class="commitHeadBranch">{{branch}}</span>{{mesg}}</td> \
        </tr>';
        return hairlip(data, trTempl);
    }
    
    
    function commitHeader(commitData) {
        var data = {
            sha: commitData.sha,
            author : commitData.author.name,
            authorEmail : commitData.author.email,
            authorDate : commitData.author.date.toDateString(),
            committer : commitData.committer.name,
            committerEmail : commitData.committer.email,
            committerrDate : commitData.committer.date.toDateString(),            
            mesg : commitData.message
        };
        console.log("show commit", commitData)
        var headerTempl = 
            'commit {{sha}}\n'+
            //'Refs: TODO\n'+
            'Author: {{author}} {{authorEmail}}\n'+
            'AuthorDate: {{authorDate}}\n'+
            'Commit: {{committer}} {{committerEmail}}\n'+
            'CommitDate: {{authorDate}}\n\n'+
            '{{mesg}}\n\n';
        return hairlip(data, headerTempl);
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
                var dirName = getRepoNameFromUrl(url);
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
            git.cloneRemote( $("#remoteUrl").val(), repoDir, progress, completed);
        });
    }
    
    function getRepoNameFromUrl(url) {
        var i1 = url.lastIndexOf(".git");
        var i2 = url.lastIndexOf("/");
        if (i1 > 0 && i2 > 0 && i1 > i2) {
            console.log(i1);
            return url.substring(i2+1, i1);
        } else {
            return url.substring(i2+1, url.length);
        }
    }
    
    function showLog(commitList) {
        var config = {
            pageSize: NUM_COMMIT_LINES,
            data: commitList,
            trRenderer: renderTRCommitLogLine,
            tableElem:  document.querySelector("#commitList")
        };
        pagedTable.init(config, updateCommitInStatusBar);
    }
    
    function chooseFSForLocalRepo() {
        if (currentContext[0] == currentContext.CONTEXT_CLONING) {
            showError("cannot open repo while clone in progress");
        }
        git.getFS(getAndThenShowLog);
    }
    
    function getAndThenShowLog() {
        //show commit log...
        git.getLog(MAX_COMMIT_HIST, function(x) {
            $("#remoteOpen").hide(); //hide clone-repo ui in case it was open
            showLog(x);
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
    
    function showError(str) {
        console.log("show user err:"+str);
        $("#errorbar").text(str);
    }
    
    return {
        moveSelLine: moveSelLine,
        selectCurrentLine: selectCurrentLine,
        askForRemote: askForRemote,
        chooseFSForLocalRepo: chooseFSForLocalRepo,
        cancelCurrentContext: cancelCurrentContext
    };
});