# sj-tig 

## A Chrome Packaged App for browsing local git repositories

## WARNING VERY ALPHA CODE !!

This is very rough at the moment!

Do **NOT** use this with any repositories you would cry about if they got deleted, corrupted or moved into an alternate universe.

## Install app for development or testing
* after git clone need to git init the git-html5 submodule 
* load into chrome as "unpacked extension" [sic]

## Debugging

* open the js console using Chrome dev tools - all the action is happening there.

## Usage

I've tried to key the key bindings similiar to [Tig](http://jonas.nitro.dk/tig/manual.html) though much of the functionality of
TIg is missing here and some features of sj-tig have no equivalent in Tig.

j, down - move up through commit list
k, up - move down through commit list
HOME - Jump to first commit
END - Jump to last line
Enter - open currently selected commit
q. esc - close the current view

## Credits

This application is only possible thanks to the hard work of the authors of the excellant open-source libraries it uses.

* Git functionality all thanks to [Ryan Ackley's git-html5 library](https://github.com/ryanackley/git-html5.js)
* Unified Diff and Patch support using [JSDiff](https://github.com/kpdecker/jsdiff)
* Diff and text file display thanks to [Marijn Haverbeke's awesome CodeMirror](http://codemirror.net/)
* Keyboard handling using [MouseTrap](http://craig.is/killing/mice)
* AMD support using [require.js](http://requirejs.org)
* Help overlay uses [QuestionMark.js[(http://impressivewebs.github.io/QuestionMark.js)
* Logos: Git Logo by Jason Long is licensed under the Creative Commons Attribution 3.0 Unported License
* Last but never least, the ubiquitous JQuery (http://jquery.com)


## License

Software License Agreement (BSD License)

Copyright (c) 2014, Maksim Lin maks@manichord.com

All rights reserved.

Redistribution and use of this software in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above
  copyright notice, this list of conditions and the
  following disclaimer.

* Redistributions in binary form must reproduce the above
  copyright notice, this list of conditions and the
  following disclaimer in the documentation and/or other
  materials provided with the distribution.

* Neither the name of Maksim Lin nor the names of its
  contributors may be used to endorse or promote products
  derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

