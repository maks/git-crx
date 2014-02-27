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
         'lib' : 'lib',
         'js': 'js'
     }
});

var dirEntryId;

console.log("App Init");

require(['js/keys', 'js/git-cmds', 'js/gui'], function (keys, git, gui) {
  //setup keyboard key bindings
  keys.init();
  
  //wire-up initial menu
  window.document.querySelector("#getDirButton").onclick = function() { git.getFS(gui.openLocalRepo); };
});