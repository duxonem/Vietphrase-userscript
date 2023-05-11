// Convert tuw VietPhrase format qua JS dictionary
// Chay tu dong lenh. Cu Phap
// node ./convertDict.js ./VietPhrase.txt

function htmlEntities(str) {
    return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'",'&#39');
}

let dataFile = process.argv.slice(-1)[0];
if (__filename == dataFile) { 
    console.log('Thieu file data');
    process.exit(1); }


const fs = require('fs');
const dataFileContents = fs.readFileSync(dataFile);

let lines = dataFileContents.toString().trim().split('\r\n');
for (let i=0; i<lines.length-1; i++) lines[i]='"'+htmlEntities(lines[i].trim()).replace('=','":"') + '"';

let dictName = dataFile.split('/'); // split('\) neu o Windows
let outFileContent = ' const ' + dictName[dictName.length-1].split('.')[0]+' = {' + lines.join(',\r\n') + '}; \r\n';

fs.writeFileSync(dataFile + '.js',outFileContent);
