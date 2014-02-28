/*jshint multistr:true */

define(['./git-cmds', 'js/hairlip', 'js/paged-table'], function(git, hairlip, pagedTable) {

    //setup Codemirror
    var cmConfig = {
      mode: "text/x-diff",
      theme: "midnight",
      readOnly: true,
      styleActiveLine: true
    };
    
    var myCodeMirror;
    var NUM_COMMIT_LINES = 10;
    var currentContext = [];
    
    function selectCurrentLine() {
      var currentLine = pagedTable.getCurrentTR();
      console.log("SEL", currentLine);
      if (!initCM()) {
          $(".CodeMirror").show();
          myCodeMirror.refresh();
      }
      if (currentContext[0] != "showCommit") {
          currentContext.push("showCommit");
      }
      git.renderCommit(currentLine.attr("id"), git.getCurrentRepo(), function(commitTxt) {
        console.log("show commit txt in CM...");
        myCodeMirror.getDoc().setValue(commitTxt);
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
    
   function updateStatusBar() {
      var currIdx = pagedTable.getCurrentIndex();
      var size = pagedTable.getData().length;
      var currTr = pagedTable.getCurrentTR();
      renderStatusBar([currTr.attr("id"), "-", "commit", currIdx + 1 , "of", size].join(" ")); //+1 because users like to see 1 indexed not zero
    }
    
    function renderStatusBar(str) {
      $("footer").text(str);
    }

    function moveSelLine(direction) {
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
      updateStatusBar();
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
    
    function askForRemote() {
        function progress (a) { 
            console.log("clone progress", a);
            var str = a.msg + "["+Math.floor(a.pct)+"%]";
            renderStatusBar(str); 
         }
        function completed (a) { 
            console.log("clone COMPLETED!"+a); 
        }
        var repoDir;
        currentContext.push("askForRemote");
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
                        console.log("set repoDir", repoDir);
                    });
                });
            });
        });
        $("#cloneButton").click(function() {
            console.log('CLONE!',  $("#remoteUrl"));
            currentContext.pop();
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
        pagedTable.init(config, updateStatusBar);
    }
    
    function chooseFSForLocalRepo() {
        git.getFS(function() {
            var MAX_COMMIT_HIST = 250;
            //show commit log...
            git.getLog(MAX_COMMIT_HIST, function(x) {
                $("#remoteOpen").hide(); //hide clone-repo ui in case it was open
                showLog(x);
            });
        });
    }
    
    function cancelCurrentContext() {
        console.log("CXT CANCEL", currentContext);
        switch(currentContext.pop()) {
            case "askForRemote":
                $("#remoteOpen").hide();
                $("#helpTextMenu").show();
            break;
            case "showCommit":
                $(".CodeMirror").hide();
            break;
            default:
                console.error("invalid context cancel");
            return;
        }
    }
    
    return {
        moveSelLine: moveSelLine,
        selectCurrentLine: selectCurrentLine,
        askForRemote: askForRemote,
        chooseFSForLocalRepo: chooseFSForLocalRepo,
        cancelCurrentContext: cancelCurrentContext
    };
});