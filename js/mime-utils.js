define(function() {
    function guessFileType(snippet, filename) {
        var extMap = {
            "diff" : "text/x-diff",
            "js" : "text/javascript",
            "json" : "application/json",
            "md" : "gfm"
        };
        var mode = "text/plain"; //default
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
        return mode;
    }
    
    return {
        guessFileType: guessFileType
    }
});