const fs = require('fs');
const path = require('path');

// Wait for the repository to be fully cloned before running this
const theographicPath = path.join(__dirname, '../../temp_theographic/json/people.json');
const bradyPath = path.join('C:', 'Users', 'ignac', '.gemini', 'antigravity', 'brain', '13f42914-c268-4e91-809e-526aabc0c70f', '.system_generated', 'steps', '1367', 'content.md');
const outputPath = path.join(__dirname, '../src/data/canonical_names.json');

const allowlist = new Set();

// 1. Add known divine figures/aliases not always in human datasets
allowlist.add("God");
allowlist.add("Lord");
allowlist.add("Jesus");
allowlist.add("Holy Ghost");
allowlist.add("Holy Spirit");
allowlist.add("Father");
allowlist.add("Son");
allowlist.add("Jesus Christ");
allowlist.add("Christ");
allowlist.add("Satan");
allowlist.add("Devil");
allowlist.add("Lucifer");
allowlist.add("Apostles");
allowlist.add("Prophets");

// 2. Parse Brady Stephenson Dataset (CSV)
if (fs.existsSync(bradyPath)) {
  const content = fs.readFileSync(bradyPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const cols = line.split(',');
    if (cols.length > 1 && cols[1] && cols[1] !== 'person_name') {
      allowlist.add(cols[1].trim());
    }
  });
  console.log(`Parsed Brady dataset. Total names so far: ${allowlist.size}`);
}

// 3. Parse Theographic Dataset (JSON)
if (fs.existsSync(theographicPath)) {
  const data = JSON.parse(fs.readFileSync(theographicPath, 'utf8'));
  data.forEach(person => {
    if (person.displayTitle) allowlist.add(person.displayTitle.trim());
    if (person.name) allowlist.add(person.name.trim());
  });
  console.log(`Parsed Theographic dataset. Total names so far: ${allowlist.size}`);
} else {
  console.warn("Theographic dataset not found at " + theographicPath);
}

const finalArray = Array.from(allowlist).sort();
fs.writeFileSync(outputPath, JSON.stringify(finalArray, null, 2));

console.log(`Successfully compiled canonical_names.json with ${finalArray.length} entries!`);
