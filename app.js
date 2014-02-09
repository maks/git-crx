/*global require, chrome */
/*jshint strict:true, globalstrict:true, browser: true, devel: true */
"use strict";

requirejs.config({
    //By default load any module IDs from git-html5 subdir
    baseUrl: 'git-html5',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
//     paths: {
//         app : "../app"
//     }
});


var dirEntryId;
var FS;
var outDir;
window.onload = init;

function init() {
    console.log("init");
    window.document.getElementById("getdirbutton").onclick = function() { getFS(); };
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

function writeToFile(fileEntry, content) {
    console.log("writing to file", fileEntry);   
    fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwriteend = function(e) {
            console.log("finsihed writing ", fileEntry);
        };
        fileWriter.onerror = fsErrorHandler;

        var contentBlob = new Blob(['Hello Git!'], {type: 'text/plain'});
        fileWriter.write(contentBlob);
    }, fsErrorHandler);
}

var fsErrorHandler = function (err) {
  console.log("fs error:", err);
};

var gitOpts = {
    dir: null,
    url: 'https://github.com/maks/testsite.git'
};

function testPackRead() {
  require(['objectstore/file_repo'], function (FileObjectStore) {
    console.debug("git store:", FileObjectStore);
    var store = new FileObjectStore(outDir); 
    store.init(function() {
      console.log("loaded git obj store", store);
      store.getHeadSha(function(headSha) {
        console.log("got HEAD as:", headSha);
        store._retrieveObject(headSha, 'Commit', function(commit){
          console.log("commit parent1 :", commit.parents[0]); 
          console.log("commit tree sha:", commit.tree);
          
          store._getTreesFromCommits([headSha, commit.parents[0]], function(trees) {
            console.log("got commit treeA, treeB",trees[0], trees[1]);
            showDiff(trees[0], trees[1]);
          }); 
        });  
      });      
    });
  });
}

/**
 * Show a Diff for the given 2 trees, recursing down through all subtrees
 */
function showDiff(treeA, treeB) {
  require(['commands/diff'], function (diff) {            
    var result = diff.diffTrees(treeA, treeB);
    console.log("DIFF:", result);
  });
}
