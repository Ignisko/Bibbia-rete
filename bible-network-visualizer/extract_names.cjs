const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'src', 'data');
const outputFile = path.join(process.env.APPDATA || process.env.HOME || '.', '.gemini', 'antigravity', 'brain', '13f42914-c268-4e91-809e-526aabc0c70f', 'extracted_names.md');

// Also write a local copy to docs/ for the repository
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}
const localOutputFile = path.join(docsDir, 'extracted_names.csv');

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

const nameMap = new Map();

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.nodes) {
      data.nodes.forEach(node => {
        if (!nameMap.has(node.name)) {
          nameMap.set(node.name, { books: new Set(), totalOccurrences: 0 });
        }
        const entry = nameMap.get(node.name);
        entry.books.add(file.replace('.json', ''));
        entry.totalOccurrences += (node.val || 1);
      });
    }
  } catch (err) {
    console.error('Error parsing', file, err.message);
  }
});

const sortedNames = Array.from(nameMap.entries()).sort((a, b) => {
  // Sort alphabetically
  return a[0].localeCompare(b[0]);
});

// Generate Markdown
let mdContent = `# Extracted Names List\n\n`;
mdContent += `This list contains all unique names extracted from the Bible text by the NLP pipeline. You can review this list to spot any misclassifications (like "meek", "Scriptures", "Galilee", etc.) and add them to the blocklist in the app.\n\n`;
mdContent += `| Name | Total Occurrences | Books Found In |\n`;
mdContent += `|---|---|---|\n`;

sortedNames.forEach(([name, data]) => {
  const booksList = Array.from(data.books).join(', ');
  mdContent += `| **${name}** | ${data.totalOccurrences} | ${booksList} |\n`;
});

// Generate CSV
let csvContent = `Name,Total Occurrences,Books Found In\n`;
sortedNames.forEach(([name, data]) => {
  const booksList = Array.from(data.books).join(';');
  // Escape quotes if needed
  const safeName = name.includes(',') ? `"${name}"` : name;
  csvContent += `${safeName},${data.totalOccurrences},"${booksList}"\n`;
});

// Write files
fs.writeFileSync(path.join(docsDir, 'extracted_names.md'), mdContent);
fs.writeFileSync(localOutputFile, csvContent);

console.log('Successfully extracted ' + sortedNames.length + ' unique names.');
