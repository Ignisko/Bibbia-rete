const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'src', 'data');
const outputFile = path.join(process.env.APPDATA || process.env.HOME || '.', '.gemini', 'antigravity', 'brain', '13f42914-c268-4e91-809e-526aabc0c70f', 'extracted_names.md');

// Also write a local copy to docs/ for the repository
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}
const booksDir = path.join(docsDir, 'books');
if (!fs.existsSync(booksDir)) {
  fs.mkdirSync(booksDir);
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

const wholeBibleMap = new Map();
const bookMaps = {};

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const bookName = file.replace('.json', '');
  bookMaps[bookName] = new Map();
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.nodes) {
      data.nodes.forEach(node => {
        // Whole Bible
        if (!wholeBibleMap.has(node.name)) {
          wholeBibleMap.set(node.name, { books: new Set(), count: 0 });
        }
        const entry = wholeBibleMap.get(node.name);
        entry.books.add(bookName);
        entry.count += (node.val || 1);
        
        // Individual Book
        if (!bookMaps[bookName].has(node.name)) {
          bookMaps[bookName].set(node.name, 0);
        }
        bookMaps[bookName].set(node.name, bookMaps[bookName].get(node.name) + (node.val || 1));
      });
    }
  } catch (err) {
    console.error('Error parsing', file, err.message);
  }
});

// Write Whole Bible CSV
const sortedWholeBible = Array.from(wholeBibleMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
let wholeCsv = `Name,Total Occurrences,Books Found In\n`;
sortedWholeBible.forEach(([name, data]) => {
  const booksList = Array.from(data.books).join(';');
  const safeName = name.includes(',') ? `"${name}"` : name;
  wholeCsv += `${safeName},${data.count},"${booksList}"\n`;
});
fs.writeFileSync(path.join(docsDir, 'whole_bible.csv'), wholeCsv);

// Write Individual Book CSVs
Object.keys(bookMaps).forEach(bookName => {
  const sortedBookNames = Array.from(bookMaps[bookName].entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let bookCsv = `Name,Occurrences\n`;
  sortedBookNames.forEach(([name, count]) => {
    const safeName = name.includes(',') ? `"${name}"` : name;
    bookCsv += `${safeName},${count}\n`;
  });
  fs.writeFileSync(path.join(booksDir, `${bookName}.csv`), bookCsv);
});

console.log(`Successfully generated whole_bible.csv and ${Object.keys(bookMaps).length} individual book files.`);
