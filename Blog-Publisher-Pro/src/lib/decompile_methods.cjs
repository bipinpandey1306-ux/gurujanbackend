const fs = require('fs');

const snippet = fs.readFileSync('src/lib/bundle-snippet.txt', 'utf8');

// Find 'class WQ'
const classIndex = snippet.indexOf('class WQ');
if (classIndex === -1) {
  console.log('class WQ not found');
  process.exit(1);
}

console.log('Found class WQ at index', classIndex);
// Let's print the next 20,000 characters from class WQ
const classContent = snippet.substring(classIndex, classIndex + 25000);
fs.writeFileSync('src/lib/class-wq-raw.txt', classContent, 'utf8');
console.log('Wrote raw class definition to src/lib/class-wq-raw.txt');
