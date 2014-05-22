"use strict";

QUnit.config.autostart = false;

requirejs.config({
     paths: {
         'objectstore' : "/git-html5/objectstore",
         'commands' : "/git-html5/commands",
         'formats' : "/git-html5/formats",
         'utils' : "/git-html5/utils",
         'thirdparty' : "/git-html5/thirdparty",
         'npm' : "/node_modules",
         'lib' : '/lib',
         'js': '/js',
         'cm': '/lib/cm'
     }
});
 
require(['./core-tests', 'js/git-cmds'], function(coreTests, git) {
    //first need to get FS root for tests...
    git.getFS(function(dirEntry) {
        QUnit.start(); //now run tests
        console.log("started tests")
    });
});
