//implements a paginated html table UI
define(function() {
    
         /**
         * config object with following properties:
         * pageSize - number of rows per "page" in table
         * data - Array of objects, each obj represents 1 obj of the table
         * trRenderer - function returns the html render for a given line of the table
         * tableElem - DOM  Table element for this table
         */
        function PagedTable(config) {
            var errMesg;
            
            this.currentLine = 0; //current selected TR of table
            this.currentIndex = 0; //index into data matching currentLine
            this.conf = config;
            this.fillTable = function(startIdx, startAt) {
                var jqTable = $(this.conf.tableElem).children("tbody");
                jqTable.empty();
                
                for (this.currentIndex = startIdx; (this.currentIndex < (startIdx+this.conf.pageSize)) && (this.currentIndex < this.conf.data.length); this.currentIndex++) {
                    jqTable.append(this.conf.trRenderer(this.conf.data[this.currentIndex]));
                }
                
                if (!startAt) {
                    this.currentIndex = startIdx; //reset to top of curr page
                } else {
                    this.currentIndex = startAt;
                }
                this.currentLine = jqTable.find("tr").eq(this.currentIndex-startIdx);
                this.currentLine.addClass("selected");
            };
            
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
            //make sure only Ints
            config.pageSize = Math.floor(this.conf.pageSize);
            this.fillTable(0);
            
            // Methods =================================        
            this.resize = function(pageSize) {
                var oldPageSize = conf.pageSize;
                this.conf.pageSize = Math.floor(pageSize);
                var nuStartIdx = Math.floor(this.currentIndex / pageSize);
                console.log("resize offset:",nuStartIdx);
                this.fillTable(nuStartIdx, this.currentIndex);
            };
            
            this.next = function() {
                var nuLine = this.currentLine.next();
                if (nuLine[0]) {
                    this.currentLine.removeClass("selected");
                    nuLine.addClass("selected");
                    this.currentLine = nuLine;
                    this.currentIndex++;
                } else {
                    //at bottom, need to page down if possible
                    this.nextPage();
                }
            };
            
            this.prev = function() {
                var nuLine = this.currentLine.prev();
                if (nuLine[0]) {
                    this.currentLine.removeClass("selected");
                    nuLine.addClass("selected");
                    this.currentLine = nuLine;
                    this.currentIndex--;
                } else {
                    //at top, need to page up if possible
                   this.prevPage();
                }
            };
            
            this.prevPage = function() {
                if (this.currentIndex > 0) {
                    this.fillTable(this.currentIndex-this.conf.pageSize, this.currentIndex - 1);
                }
            };
            
            this.nextPage = function() {
                if (this.currentIndex < this.conf.data.length-1) {
                    this.fillTable(this.currentIndex+1);
                }
            };
             
            this.first = function() {
                this.fillTable(0);
            };
            
             
            this.last = function() {
                var topOfLastPage = Math.floor(this.conf.data.length / this.conf.pageSize) * this.conf.pageSize;
                this.fillTable(topOfLastPage);
            };
            
             
            this.getCurrentTR = function() {
                return this.currentLine;
            };
            
            this.getCurrentIndex = function() {
                return this.currentIndex;
            };
            
            this.getData = function() {
                return this.conf.data;
            };
            
            this.redraw = function() {
                this.fillTable(0);
            }
            this.setHeader = function(txt) {
                var jqTableHeader = $(this.conf.tableElem).find("th");
                jqTableHeader.text(txt);
            }
        }    
    return PagedTable;
});