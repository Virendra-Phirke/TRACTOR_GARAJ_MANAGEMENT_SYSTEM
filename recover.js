const fs = require('fs');
let content = fs.readFileSync('recovered.json', 'utf8');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const match = content.match(/"CodeContent":"(.*?)","Description"/);
if (match) {
  let code = JSON.parse('"' + match[1] + '"');
  fs.writeFileSync('src/lib/pdf/invoice-pdf.ts', code);
  console.log('Recovered!');
} else {
  console.log('Match failed');
}
