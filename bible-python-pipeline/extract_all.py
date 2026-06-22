import urllib.request
import re
import json
import os
import sys

try:
    import spacy
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "spacy"])
    import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

print("Downloading Douay-Rheims Bible from Project Gutenberg...")
url = "https://www.gutenberg.org/cache/epub/8300/pg8300.txt"
response = urllib.request.urlopen(url)
text = response.read().decode('utf-8')

chapter_markers = list(re.finditer(r'^([1-4]?[A-Za-z ]+) Chapter \d+\r?$', text, re.MULTILINE))

books = {}
for match in chapter_markers:
    book_name = match.group(1).strip()
    if book_name not in books:
        books[book_name] = []
    books[book_name].append(match)

output_dir = os.path.join(os.path.dirname(__file__), "..", "bible-network-visualizer", "src", "data")
os.makedirs(output_dir, exist_ok=True)

god_terms = {"God", "Jesus", "Lord", "Holy Ghost", "Father"}
invalid_names_lower = {"thou", "thee", "amen", "yea", "unto", "hath", "doth", "shalt", "thy", "thine", "upon", "hast", "wherefore", "shall", "behold", "arise", "viz", "didst", "canst", "mayst"}

def normalize_entity(ent):
    ent = re.sub(r'[^\w\s]', '', ent).strip()
    
    if ent.lower().endswith(" the"):
        ent = ent[:-4].strip()
    if ent.lower().endswith(" of"):
        ent = ent[:-3].strip()
        
    if ent.lower() == "christ":
        return "Jesus"
        
    return ent

print(f"Found {len(books)} books. Processing...")

index_content = ""
export_obj = "export const bookData = {\n"
book_list = []

old_testament = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", 
    "Josue", "Judges", "Ruth", "1 Kings", "2 Kings", "3 Kings", "4 Kings", 
    "Psalms", "Proverbs", "Ecclesiastes", "Canticle of Canticles", "Wisdom", 
    "Ecclesiasticus", "Isaias", "Jeremias", "Lamentations", "Baruch", 
    "Ezechiel", "Daniel"
]

new_testament = [
    "Matthew", "Mark", "Luke", "John", 
    "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", 
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", 
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", 
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Apocalypse"
]

priority_books = old_testament + new_testament

for book_name in priority_books:
    if book_name not in books:
        continue
        
    print(f"Processing {book_name}...")
    book_markers = books[book_name]
    
    start_idx = book_markers[0].end()
    next_book_idx = len(text)
    for match in chapter_markers:
        if match.start() > start_idx and match.group(1).strip() != book_name:
            next_book_idx = match.start()
            break
            
    book_text = text[start_idx:next_book_idx]
    chapter_texts = re.split(r'^[1-4]?[A-Za-z ]+ Chapter \d+\r?$', book_text, flags=re.MULTILINE)
    
    nodes_dict = {}
    cooccurrences = {}
    
    for chapter_text in chapter_texts:
        if len(chapter_text.strip()) < 10:
            continue
        doc = nlp(chapter_text)
        chapter_entities = set()
        
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = normalize_entity(ent.text)
                
                if name.lower().endswith("eth") or name.lower() in invalid_names_lower or len(name) <= 2:
                    continue
                    
                chapter_entities.add(name)
                
        if "John the Baptist" in chapter_text:
            chapter_entities.add("John the Baptist")
            
        for term in god_terms:
            if term in chapter_text:
                chapter_entities.add(term)
                
        chapter_entities = list(chapter_entities)
        
        for entity in chapter_entities:
            if entity not in nodes_dict:
                nodes_dict[entity] = {"id": entity, "name": entity, "val": 0}
            nodes_dict[entity]["val"] += 1
            
        for i in range(len(chapter_entities)):
            for j in range(i + 1, len(chapter_entities)):
                edge = tuple(sorted([chapter_entities[i], chapter_entities[j]]))
                if edge not in cooccurrences:
                    cooccurrences[edge] = 0
                cooccurrences[edge] += 1
                
    network_data = {
        "nodes": list(nodes_dict.values()),
        "links": [{"source": pair[0], "target": pair[1], "value": weight} for pair, weight in cooccurrences.items() if weight > 1]
    }
    
    safe_book_id = book_name.lower().replace(" ", "_").replace("1", "1").replace("2", "2").replace("3", "3").replace("4", "4")
    
    json_path = os.path.join(output_dir, f"{safe_book_id}.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(network_data, f)
        
    var_name = safe_book_id
    if var_name[0].isdigit():
        var_name = f"_{var_name}"
        
    index_content += f"import {var_name} from './{safe_book_id}.json';\n"
    export_obj += f"  '{safe_book_id}': {var_name},\n"
    testament = "Old Testament" if book_name in old_testament else "New Testament"
    book_list.append(f"  {{ id: '{safe_book_id}', name: '{book_name}', testament: '{testament}' }}")

export_obj += "};\n\n"
export_list = "export const bookList = [\n" + ",\n".join(book_list) + "\n];\n"

with open(os.path.join(output_dir, "index.js"), 'w', encoding='utf-8') as f:
    f.write(index_content + "\n" + export_obj + export_list)

print("Done processing books!")
