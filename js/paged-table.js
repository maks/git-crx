define(function() {
 //implements a paginated html table "control"

    var currentLine = 0;
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
            $(jqTable.append(trRendr(data[i])));
        }
    }
    
    function up() {
        
    }
    
    function down() {
        
    }

    return {
        init: init,
        down: down,
        up: up
    } 
    
});