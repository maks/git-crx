define(['./git-cmds', 'js/hairlip', 'js/paged-table'], function(git, hairlip, pagedTable) {

    //setup Codemirror
    var cmConfig = {
      mode: "text/x-diff",
      theme: "midnight",
      styleActiveLine: true,
      readonly: true
    };
    var myCodeMirror;
    var currentLine = null;
    var commitList = [];
    
    function selectCurrentLine() {
      console.log("SEL", currentLine);
      initCM();
      git.renderCommit(currentLine.attr("id"), git.getCurrentRepo(), function(commitTxt) {
        console.log("show commit DONE");
        myCodeMirror.getDoc().setValue(commitTxt);
      });
    }

    function initCM() {
      if (!myCodeMirror) {
        console.log("CM init");
        myCodeMirror = CodeMirror(document.querySelector("#mainContainer"), cmConfig);
        $(".CodeMirror").height("50%");
        $("#commitListContainer").height("50%");
      }
    }
    
    function updateStatusBar(str) {
      $("footer").text(str);
    }
    
    function clearSel() {
       currentLine.removeClass();
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
      var curr = pagedTable.getCurrent();
      if (curr) {
        var sha = curr.attr("id");
        //FIXME: 
        //updateStatusBar([sha, "-", "commit ", commitListShas.indexOf(sha)+1, " of ", commitListShas.length].join("  "));
      }
    }


    /**
     * @return html for a TR that represents the given commit
     */
    function renderTRCommitLogLine(commitData) {
         function lineOr70chr(value) { 
              var l = value.indexOf('\n');
              return value.trim().substr(0, (l > 0) ? Math.min(l,70) : 70);
         };
        var data = {
            author : commitData.author.name,
            date : commitData.author.date.toDateString(),
            time : commitData.author.date.getHours()+":"+commitData.author.date.getMinutes(),
            mesg : lineOr70chr(commitData.message)
        }
        var trTempl = '<tr id="{{sha}}"> \
            <td class="commitDate">{{date}}</td> \
            <td class="commitTime">{{time}}</td> \
            <td class="commitAuthor">{{author}}</td> \
            <td class="commitType">{{type}}</td> \
            <td class="commitShortMesg"><span class="commitHeadBranch">{{branch}}</span>{{mesg}}</td> \
        </tr>';
        return hairlip(data, trTempl);
    }
    
    function showLog(commitList) {
         commitListShas = commitList;
         pagedTable.init(10, commitList, renderTRCommitLogLine, document.querySelector("#commitList"));
    }
    
    function askForRemote() {
        function progress (a) { console.log("clone progress", a); };
        function completed (a) { console.log("clone COMPLETED!", a); };
        var repoDir;
        
        $("#getDirButton").hide();
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
            git.cloneRemote( $("#remoteUrl").val(), repoDir, progress, completed);
        });
    }    
    
    function getRepoNameFromUrl(url) {
        var i1 = url.lastIndexOf(".git");
        var i2 = url.lastIndexOf("/");
        if (i1 > 0 && i2 > 0 && i1 > i2) {
            console.log(i1)
            return url.substring(i2+1, i1);
        } else {
            return url.substring(i2+1, url.length);
        }
    }
    
    function chooseFSForLocalRepo() {
        git.getFS(function() {
            var MAX_COMMIT_HIST = 25;
            //show commit log...
            git.getLog(MAX_COMMIT_HIST, function(x) {
                $("#remoteOpen").hide(); //hide clone-repo ui in case it was open
                showLog(x);
            });
        });
    }
    
    return {
        clearSel: clearSel,
        moveSelLine: moveSelLine,
        selectCurrentLine: selectCurrentLine,
        showLog: showLog,
        askForRemote: askForRemote,
        chooseFSForLocalRepo: chooseFSForLocalRepo
    };
});