/*jshint multistr:true */

define(['js/hairlip', 'utils/misc_utils'], function(hairlip, miscUtils) {
    
    function commitHeader(commitData) {
        var data = {
            sha: commitData.sha,
            author : commitData.author.name,
            authorEmail : commitData.author.email,
            authorDate : commitData.author.date.toDateString(),
            committer : commitData.committer.name,
            committerEmail : commitData.committer.email,
            committerrDate : commitData.committer.date.toDateString(),            
            mesg : commitData.message
        };
        console.log("show commit", commitData)
        var headerTempl = 
            'commit {{sha}}\n'+
            //'Refs: TODO\n'+
            'Author: {{author}} {{authorEmail}}\n'+
            'AuthorDate: {{authorDate}}\n'+
            'Commit: {{committer}} {{committerEmail}}\n'+
            'CommitDate: {{authorDate}}\n\n'+
            '{{mesg}}\n\n';
        return hairlip(data, headerTempl);
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
            time : pad(commitData.author.date.getHours(),2)+":"+pad(commitData.author.date.getMinutes(),2),
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
    
    function renderTRBranchLine(branchData) {
        var trTempl = '<tr id="{{sha}}"> \
            <td class="branchName">{{name}}</td> \
        </tr>';
        return hairlip(branchData, trTempl);
    }
    
    function renderTRTreeLine(treeItem) {
        var treeItemData = {
            name: treeItem.name,
            sha: miscUtils.convertBytesToSha(treeItem.sha),
            type: (treeItem.isBlob ? "file" : (treeItem.isSubmodule ? "module" : "dir"))
        };
        var trTempl = '<tr id="{{sha}}" class="{{type}}" > \
            <td>{{type}}</td> \
            <td class="filename">{{name}}</td> \
        </tr>';
        return hairlip(treeItemData, trTempl);
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
    
    //from http://stackoverflow.com/a/10073788/85472
    function pad(n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
    

    return {
        commitHeader: commitHeader,
        renderTRCommitLogLine: renderTRCommitLogLine,
        renderTRBranchLine: renderTRBranchLine,
        getRepoNameFromUrl: getRepoNameFromUrl,
        renderTRTreeLine: renderTRTreeLine
    };
});