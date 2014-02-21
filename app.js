/*global require, requirejs, chrome */
/*jshint strict:true, globalstrict:true, browser: true, devel: true */
"use strict";

requirejs.config({
     paths: {
         'objectstore' : "git-html5/objectstore",
         'commands' : "git-html5/commands",
         'formats' : "git-html5/formats",
         'utils' : "git-html5/utils",
         'thirdparty' : "git-html5/thirdparty",
         'npm' : "node_modules",
         'lib' : 'lib'
     }
});

var dirEntryId;
var FS;
var outDir;

var currentLine = null;
var commitListShas = [];

console.log("init");
window.document.querySelector("#getDirButton").onclick = function() { getFS(); };

//key bindings
Mousetrap.bind(['j', 'up'], function(x) { moveSelLine("up"); });
Mousetrap.bind(['k', 'down'], function(x) { moveSelLine("down"); });
Mousetrap.bind(['home'], function(x) { moveSelLine("home"); });
Mousetrap.bind(['end'], function(x) { moveSelLine("end"); });
Mousetrap.bind(['enter'], function(x) { selCurrentLine(); });

jQuery.fn.extend({
scrollToMe: function () {
    var x = jQuery(this).offset().top - 100;
    $('html').scrollTop(x);
}});


function selCurrentLine() {
  console.log("SEL", currentLine);
  showCommit(currentLine.attr("id"));
}

function updateStatusBar(str) {
  $("#statusbarContainer").text(str);
}

function clearSel() {
   currentLine.removeClass();
}

function moveSelLine(direction) {
  if (!currentLine && direction) {
    return;
  }
  var nuLine;
  switch (direction) {
    case "up":
      nuLine = currentLine.prev();
    break;
    case "down":
      nuLine = currentLine.next();
    break;
    case "home":
      nuLine = currentLine.parent().children().first();
    break;
    case "end":
       nuLine = currentLine.parent().children().last();
    break;
    default:
      currentLine = $("#commitList tr:first-child");
      currentLine.addClass("selected");
      return;
    break;
  }
  if (nuLine && nuLine[0]) {
    currentLine.removeClass();
    nuLine.addClass("selected");
    nuLine.scrollToMe();
    currentLine = nuLine;
  }
  if (currentLine) {
    var sha = currentLine.attr("id");
    updateStatusBar([sha, "-", "commit ", commitListShas.indexOf(sha)+1, " of ", commitListShas.length].join("  "));
  }
}


function getFS() {
  chrome.fileSystem.chooseEntry({ type : "openDirectory" }, function(entry) {
    console.debug("got FS Dir:", entry);
    FS = entry.filesystem;
    chrome.fileSystem.getWritableEntry(entry, function(entry) {
        console.debug("got FS writable:", entry);      
        outDir = entry;
        //show commit log...
        testLog(10);
    });
  });
}


var fsErrorHandler = function (err) {
  console.log("fs error:", err);
};

var gitOpts = {
    dir: null,
    url: 'https://github.com/maks/testsite.git'
};

function testLog(limit) {
  require(['objectstore/file_repo', 'commands/diff'], function (FileObjectStore, diff) {
    console.debug("git store:", FileObjectStore);
    var store = new FileObjectStore(outDir); 
    store.init(function() {
      console.log("loaded git obj store", store);
      store.getHeadSha(function(headSha) {
        console.log("got HEAD as:", headSha);
        console.log("limit to:"+limit);
        store._getCommitGraph([headSha], limit, function(commitList){
          //console.log("commit graph", commitList);
          commitListShas = [];
          for (var i=0; i < commitList.length; i++) {
            var commit = commitList[i];
            commitListShas.push(commit.sha);
            //console.log("commit "+commit.sha+"\nauthor:"+commit.author.name+" <"+commit.author.email+">\nDate:"+commit.author.date+"\n\n\t"+commit.message+"\n");
          }
          testLogHtml(commitList);
        });
      });
    });
  }); 
}

function testAMD() {
  require(["lib/distal", "js/ui"], function(distal, ui) { 
    //console.log("distal", typeof distal);
    //console.log("ui", ui);
  });
  
}

function testLogHtml(list) {
  require(["lib/distal"], function(distal) { 
     var data = { commits: list };
     distal.format["lineOr70chr"] = function(value) { 
        if ((typeof value.substr == "function") && (typeof value.indexOf == "function")) {
          var l = value.indexOf('\n');
          return value.trim().substr(0, (l > 0) ? Math.min(l,70) : 70);
        } else {
          return value;
        }
     };
    if (currentLine) {
      currentLine.removeClass();
    }
    distal(document.querySelector("#commitList"), data);
    moveSelLine();
  });  
}

function showCommit(sha, repo, callback) {
  console.log("SHOW COMMIT: "+sha);
}

function testDiff() {
  require(['objectstore/file_repo', 'commands/diff'], function (FileObjectStore, diff) {
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
  });
}


function testClone() {
  outDir.getDirectory('test'+Date.now(), {create:true}, function(workDir){
    chrome.fileSystem.getWritableEntry(workDir, function(entry) {
      console.log("prj", entry);
      require(['git-html5/commands/clone', 'objectstore/file_repo'], function (clone, FileObjectStore) {
        var fileStore = new FileObjectStore(entry);
        var options = {
          dir: entry,
          objectStore: fileStore,
          url: 'https://github.com/maks/testsite.git',
          depth: null,
          progress: function (a) { console.log("clone progress", a); } 
        };
        
        fileStore.init( function() {
          console.log("cloning...", options.dir, typeof clone);
            clone(options, function(a) {
              console.log("clone has completed", a);
            }, fsErrorHandler);
          });
      });
    });
  });
}
