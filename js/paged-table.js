define(function() {
 //implements a paginated html table "control"

    var currentLine; //current selected TR of table
    var currentIndex; //index into data matching currentLine
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
        
        fillTable(0);
    }
    
    function fillTable(startIdx, startAtBottom) {
        var jqTable = $(domTable);
        jqTable.empty();
        
        for (currentIndex = startIdx; (currentIndex < (startIdx+pgSize)) && (currentIndex < data.length); currentIndex++) {
            jqTable.append(trRendr(data[currentIndex]));
            console.log(currentIndex);
        }
        
        if (!startAtBottom) {
          currentIndex = startIdx; //reset to top of curr page
        } else {
            currentIndex--; //back up one to be on last line
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
            nextPage()
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
            fillTable(currentIndex-pgSize, true);
        }
    }
    
    function nextPage() {
        if (currentIndex < data.length-1) {
            fillTable(currentIndex+1);
        }
    }
    
     
    function first() {
        fillTable(0);
    }
    
     
    function last() {
        var topOfLastPage = Math.floor(data.length / pgSize) * pgSize;
        fillTable(topOfLastPage);
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