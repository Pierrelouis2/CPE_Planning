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

async function convertFile(file, format){
    result = await convertapi.convert(format, { File: file , EnableOcr: 'true'});
    if (result.error) {
        console.log("Error: " + result.error);
        return "error";
    }
    file = await result.file.save(`${file.split('.')[0]}.${format}`);
    console.log("File saved: " + file);
    return file;
};


async function main () {
    file_xlsx = await convertFile('edt.pdf', 'xls');
    if (file_xlsx == "error") {
        console.log("Error ");
        return;
    }
    file_csv = await convertFile(file_xlsx, 'csv');
    if (file_csv == "error") {
        console.log("Error");
        return;
    }
    read_csv(file_csv);
    };

main();
