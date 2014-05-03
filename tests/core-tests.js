define(['js/git-cmds', 'utils/file_utils'], function(git, fileUtils) {
    module("Core Tests");
    
    test("require.js needed", function() {
       expect(1);
       equals(typeof require, "function", "require function must be available");
    });

    test("check requirejs loading", function() {
        expect(1);
        equals(typeof git.cloneRemote, "function", "clone function should exist");
    });
    
    asyncTest("check can do XHR", function() {
       expect(1);
       function reqListener () {
          equal(this.responseText.trim(), "pong", "expect correct res text from server"); 
          start();
        }
        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.open("get", "http://manichord.com/ping", true);
        oReq.send();
    });
    
    asyncTest("check can do Basic Auth XHR", function() {
       expect(1);
       function reqListener () {
          equal(this.responseText.trim(), "super", "expect correct res text from server"); 
          start();
        }
        var authCreds = "maks:test1";
        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.open("get", "http://manichord.com/auth-test/secret", true);
        oReq.setRequestHeader("Authorization", "Basic "+btoa(authCreds));
        oReq.send();
    });
    
    module("Git Dircache Tests");
    
    asyncTest("read index file test", function() {
       expect(3);
       //for now need to call as getLog is actually where the filestore (currentrepo) is init'd, doh! :-( 
       git.getLog(10, null, function() {
            equal(typeof git.getCurrentRepo(), "object", "expect to have a local repo set");
            git.getDircache(function(dircache) {
                equal(typeof dircache, "object", "dircache must be available");
                equal(dircache.getEntry(".gitignore").path, ".gitignore", "got .gitignore");
                start();
            });    
       });
    });
    
    asyncTest("check dircache sort order", function() {
       
       //fileUtils.readFile(git.getOutDir(), "tests/dircache-sorted-paths.json", "Text", function(txt) {
         fileUtils.readFile(git.getOutDir(), "tests/dircache.txt", "Text", function(txt) {
           //TODO - need to checkout specific commit  49df7f2085391a28fc37aa056f5c0064f0040482 that matches test data file
           git.getDircache(function(dircache) {
               var sortedEntries = txt.split("\n");
               equal(sortedEntries.length, dircache.entriesCount(), "");
               var ourSortedEntryPaths = dircache.getSortedEntryPaths();
               for (var i = 0; i < sortedEntries.length; i++) {
                   //compare our order of entries vs how cgit did it in the test data
                   equal(sortedEntries[i], ourSortedEntryPaths[i], "entries must be sorted in order Git specs");
               }
               start();
           });
       }, function(e) { ok(null, "got error reading test file data:"+e)}); 
    });
    
});


