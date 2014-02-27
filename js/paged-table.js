define(function() {
 //implements a paginated html table "control"

    var currentLine;
    var data;
    var trRendr;
    var pgSize;
    var domTable;

    /**
     * tablePageSize - number of rows per "page" in table
     * data - Array of objects, each obj represents 1 obj of the table
     * trRenderer - function returns the html render for a given line of the table
     * tableElem - DOM  Table element for this table
     */
    function init(tablePageSize, tableData, trRenderer, tableElem) {
        data = tableData;
        trRendr = trRenderer;
        pgSize = tablePageSize;
        domTable = tableElem;
        
        var jqTable = $(tableElem);
        jqTable.empty();
        
        for (var i=0; i < pgSize; i++) {
            jqTable.append(trRendr(data[i]));
        }
        
        currentLine = jqTable.find("tr").eq(0);
        currentLine.addClass("selected");
        console.log("curr line", currentLine);
    }
    
    
    function next() {
        console.log("PGT down")
        var nuLine = currentLine.next();
        if (nuLine[0]) {
            currentLine.removeClass("selected");
            nuLine.addClass("selected");
            currentLine = nuLine;
        } else {
            //at bottom, need to page down if possible
            pageDown()
        }
    }
    
    function prev() {
        console.log("PGT up")
        var nuLine = currentLine.prev();
        if (nuLine[0]) {
            currentLine.removeClass("selected");
            nuLine.addClass("selected");
            currentLine = nuLine;
        } else {
            //at top, need to page up if possible
            pageUp();
        }
    }
    
    function pageUp() {
        console.error("pageup TODO");
    }
    
    function pageDown() {
        console.error("pagedown TODO");
    }
    
     
    function first() {
        
    }
    
     
    function last() {
        
    }
    
     
    function getCurrent() {
        return currentLine;
    }

    return {
        init: init,
        next: next,
        prev: prev,
        first: first,
        last: last,
        getCurrent: getCurrent
    } 
    
});