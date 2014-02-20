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
     }
});

var dirEntryId;
var FS;
var outDir;

var currentLineNum = 0;
var MAX_LINES = 3;

console.log("init");
window.document.querySelector("#getDirButton").onclick = function() { getFS(); };
moveSelLine();


//key bindings
Mousetrap.bind(['j', 'up'], function(x) { moveSelLine("up"); });
Mousetrap.bind(['k', 'down'], function(x) { moveSelLine("down"); });
Mousetrap.bind(['enter'], function(x) { selCurrentLine(); });

function selCurrentLine() {
  console.log("SELECT", $("#commit-"+currentLineNum));
}

function moveSelLine(direction) {
  var nuLine = 0;
  switch (direction) {
    case "up":
      nuLine = (currentLineNum == 0) ? currentLineNum : currentLineNum-1;
    break;
    case "down":
      nuLine = (currentLineNum == MAX_LINES-1) ? currentLineNum : currentLineNum+1;
    break;
    default:
      $("#commit-"+currentLineNum).addClass("selected");
    break;
  }
  if (nuLine != currentLineNum) {
    $("#commit-"+currentLineNum).removeClass();
    $("#commit-"+nuLine).addClass("selected");
    currentLineNum = nuLine;
  }
}


function getFS() {
  chrome.fileSystem.chooseEntry({ type : "openDirectory" }, function(entry) {
    console.debug("got FS Dir:", entry);
    FS = entry.filesystem;
    chrome.fileSystem.getWritableEntry(entry, function(entry) {
        console.debug("got FS writable:", entry);      
        outDir = entry;
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
          for (var i=0; i < commitList.length; i++) {
            var commit = commitList[i];
            console.log("commit "+commit.sha+"\nauthor:"+commit.author.name+" <"+commit.author.email+">\nDate:"+commit.author.date+"\n\n\t"+commit.message+"\n");
          }
        });
      });
    });
  }); 
}

function testShow(sha) {
  
}

function showCommit(sha, repo, callback) {
  
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
