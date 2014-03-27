define(function() {
    function guessFileType(snippet, filename) {
        var extMap = {
            "diff" : {
                mime: "text/x-diff",
                name: "diff"
            },
            "js" : {
                mime: "text/javascript",
                name: "javascript"
            },
            "json" : {
                mime: "application/json",
                name: "javascript"
            },
            "html" : {
                mime: "text/html",
                name: "htmlmixed"
            },
            "css" : {
                mime: "text/css",
                name: "css"
            },
            "ts" : {
                mime: "text/typescript",
                name: "javascript"
            },
            "java" : {
                mime: "text/x-java",
                name: "clike"
            },
            "c" : {
                mime: "text/x-csrc",
                name: "clike"
            },
            "h" : {
                mime: "text/x-csrc",
                name: "clike"
            },
            "http" : {
                mime: "message/http",
                name: "http"
            },
            "md" : {
                mime: "text/x-markdown",
                name: "markdown"
            }
        };
        var mode;
        var ext;
        console.log("guess for "+filename);
        if (filename) {
            if (filename.lastIndexOf(".") > 0) {
                ext = filename.substring(filename.lastIndexOf(".")+1, filename.length);
            }
            if (ext) {
                console.log("got file ext:" + ext);
                mode = extMap[ext];
                console.log("using mode:"+mode);
            } else {
                //TODO try reading file to guess content type
            }
        }
        return mode || { mime: "text/plain" };
    }
    
    return {
        guessFileType: guessFileType
    }
});