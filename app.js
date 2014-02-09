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

console.log("init");
window.document.getElementById("getdirbutton").onclick = function() { getFS(); };


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
          
          store._getTreesFromCommits([commit.parents[0], headSha], function(trees) {
            console.log("got commit treeA, treeB",trees[0], trees[1]);
            showDiff(trees[0], trees[1], store);
          }); 
        });  
      });      
    });
  });
}

/**
 * Show a Diff for the given 2 trees, recursing down through all subtrees
 * TODO: the recursing bit !!!
 */
function showDiff(treeA, treeB, store) {
  require(['git-html5/commands/diff', 'npm/diff/diff', 'utils/misc_utils'], function (gitdiff, _na_, utils) { //JsDiff is a global, no AMD module
    var result = gitdiff.diffTrees(treeA, treeB);
    console.log("Diff Result:", result);
    for (var i=0; i < result.modified.length; i++) {
      console.log("modified:", result.modified[i]);
      if (result.modified[i][0].isBlob) {
        var shaA = result.modified[i][0].sha;
        var shaB = result.modified[i][1].sha;
        var name = result.modified[i][0].name;
        var gitDiffPrefix = utils.convertBytesToSha(shaA).substr(0, 7)+".."+utils.convertBytesToSha(shaB).substr(0, 7);
        store._retrieveBlobsAsStrings([shaA, shaB], function(objList){
          //console.log("objList:", objList);
          if (objList.length == 2) {
            console.log(JsDiff.createPatch(name, objList[0].data, objList[1].data));  
          } else {
            console.error("Did not find both Blob objects for SHA's:", objList);
          }
        });
      } else {
        console.log("modified is tree: ", result.modified[i]);
      }
    }
  });
}
