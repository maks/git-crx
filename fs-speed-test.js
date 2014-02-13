var outDir;

console.log("init");

window.document.querySelector("#getdirbutton").onclick = function() { getFS(); };

function fsSpeedTest() {
  console.time('Create data');
  var DATA_SIZE = 1e7;
  console.log("Using File Data Size:"+DATA_SIZE);
  var bigData = new Array(DATA_SIZE).join("foobar");
  //var bigData = new Array(10).join("foobar");
  console.timeEnd('Create data');
  //console.time('Async done');
  //console.time('Set done');
  console.time('Filewrite');
  outDir.getFile('fs-speed-test'+Date.now()+'.txt', {create: true}, function(fileEntry) {
      writeToFile(fileEntry, bigData, function() {
      console.timeEnd('Filewrite');
    });
  }, fsErrorHandler);  
}

function fsSpeedTestMultiSmall() {
  var NUM_OF_FILES = 500;
  var i;
  function done() {
    console.timeEnd('MultiFilewrite');
  }
  console.time('MultiFilewrite');
  for (i = 0; i < NUM_OF_FILES; i++) {
    if (i == (NUM_OF_FILES-1)) {
      fsWriteSmall(i, done);
    } else {
      fsWriteSmall(i, null);  
    }    
  }  
}

function fsWriteSmall(count, doneCB) {
  var DATA_SIZE = 1e3;
  var data = new Array(DATA_SIZE).join("testtest");
  var filename = 'fs-speed-test'+count+'.txt';
  outDir.getFile(filename, {create: true}, function(fileEntry) {
      writeToFile(fileEntry, data, doneCB);
  }, fsErrorHandler);  
}



function writeToFile(fileEntry, content, callback) {
  fileEntry.createWriter(function(fileWriter) {
    fileWriter.onwriteend = function(e) {
        //console.log("finished writing ", fileEntry);
        if (callback) {
          callback();  
        }
    };
    fileWriter.onerror = fsErrorHandler;
    var contentBlob = new Blob([content], {type: 'text/plain'});
    fileWriter.write(contentBlob);
  }, fsErrorHandler);
}