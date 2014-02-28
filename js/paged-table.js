//implements a paginated html table UI
define(function() {
    var currentLine; //current selected TR of table
    var currentIndex; //index into data matching currentLine
    var conf;

    /**
     * config object with following properties:
     * pageSize - number of rows per "page" in table
     * data - Array of objects, each obj represents 1 obj of the table
     * trRenderer - function returns the html render for a given line of the table
     * tableElem - DOM  Table element for this table
     */
    function init(config, callback) {
        var errMesg;
        if (!config.pageSize || (typeof config.pageSize != "number")) {
            errMesg = "pagesize missing or not a number";
        } else if (!config.data || !config.data.length) {
            errMesg = "data missing or not an array";
        } else if (!config.trRenderer || (typeof config.trRenderer != "function")) {
            errMesg = "trRenderer missing or not a function";
        } else if (!config.tableElem) {
            errMesg = "tableElem missing";
        }
        if (errMesg) {
            console.error(errMesg, config);
            throw new Error(errMesg) ;
        }
        conf = config;
        //make sure only Ints
        config.pageSize = Math.floor(conf.pageSize);
        fillTable(0);
        callback();
    }
    
    function resize(pageSize) {
        var oldPageSize = conf.pageSize;
        conf.pageSize = Math.floor(pageSize);
        var nuStartIdx = Math.floor(currentIndex / pageSize);
        console.log("resize offset:",nuStartIdx);
        fillTable(nuStartIdx, currentIndex);
    }
    
    function fillTable(startIdx, startAt) {
        var jqTable = $(conf.tableElem);
        jqTable.empty();
        
        for (currentIndex = startIdx; (currentIndex < (startIdx+conf.pageSize)) && (currentIndex < conf.data.length); currentIndex++) {
            jqTable.append(conf.trRenderer(conf.data[currentIndex]));
        }
        
        if (!startAt) {
            currentIndex = startIdx; //reset to top of curr page
        } else {
            currentIndex = startAt;
        }
        currentLine = jqTable.find("tr").eq(currentIndex-startIdx);
        currentLine.addClass("selected");
    }
    
    function next() {
        var nuLine = currentLine.next();
        if (nuLine[0]) {
            currentLine.removeClass("selected");
            nuLine.addClass("selected");
            currentLine = nuLine;
            currentIndex++;
        } else {
            //at bottom, need to page down if possible
            nextPage();
        }
    }
    
    function prev() {
        var nuLine = currentLine.prev();
        if (nuLine[0]) {
            currentLine.removeClass("selected");
            nuLine.addClass("selected");
            currentLine = nuLine;
            currentIndex--;
        } else {
            //at top, need to page up if possible
            prevPage();
        }
    }
    
    function prevPage() {
        if (currentIndex > 0) {
            fillTable(currentIndex-conf.pageSize, currentIndex - 1);
        }
    }
    
    function nextPage() {
        if (currentIndex < conf.data.length-1) {
            fillTable(currentIndex+1);
        }
    }
    
     
    function first() {
        fillTable(0);
    }
    
     
    function last() {
        var topOfLastPage = Math.floor(conf.data.length / conf.pageSize) * conf.pageSize;
        fillTable(topOfLastPage);
    }
    
     
    function getCurrentTR() {
        return currentLine;
    }
    
    function getCurrentIndex() {
        return currentIndex;
    }
    
    function getData() {
        return conf.data;
    }

    return {
        init: init,
        next: next,
        prev: prev,
        first: first,
        last: last,
        getCurrentTR: getCurrentTR,
        getCurrentIndex: getCurrentIndex,
        getData: getData,
        resize: resize
    };
});