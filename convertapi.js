const c = require('config');
let config = require('config');
let key = config.get('convertAPI.secret');
var convertapi = require('convertapi')(key);


function read_csv(file){
    //console.log(file)
    const fs = require('fs');
    fs.readFile(file, 'utf8', function (err, data) {
    /* parse data */
    console.log(data)
});
    
  }


convertapi.convert('csv', { File: 'edt.pdf' , EnableOcr: 'None'})
  .then(function(result) {
    // get converted file url
    console.log("Converted file url: " + result.file.url);
    // save to file
    return result.file.save('edt.csv');
  })
  .then(function(file) {
    console.log("File saved: " + file);
    read_csv(file)
  })
  .catch(function(e) {
    console.error(e.toString());
  });
