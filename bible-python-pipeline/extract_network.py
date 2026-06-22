import urllib.request
import re
import json
import os
import subprocess
import sys

# Ensure spacy is installed
try:
    import spacy
except ImportError:
    print("Installing spacy...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "spacy"])
    import spacy

# Ensure the model is installed
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading English NLP model...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

print("Downloading Douay-Rheims Bible from Project Gutenberg...")
url = "https://www.gutenberg.org/cache/epub/8300/pg8300.txt"
response = urllib.request.urlopen(url)
text = response.read().decode('utf-8')

# Extract Gospel of John
print("Extracting The Gospel According to St. John...")
start_marker = "THE HOLY GOSPEL OF JESUS CHRIST ACCORDING TO ST. JOHN"
end_marker = "THE ACTS OF THE APOSTLES"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Error finding the Gospel of John.")
    sys.exit(1)

john_text = text[start_idx:end_idx]

# Split into chapters
# Douay-Rheims uses "John Chapter X" or just "Chapter X"
chapters = re.split(r'John Chapter \d+|Chapter \d+', john_text)[1:] # Skip the intro text before Chapter 1

print(f"Found {len(chapters)} chapters in John.")

nodes_dict = {}
cooccurrences = {}

# Entities to map to the central God/Jesus node
god_aliases = {"God", "Jesus", "Jesus Christ", "Christ", "Lord", "Son of God", "Son of man", "Word", "Father", "Holy Ghost"}
central_node_name = "Jesus / God"

def normalize_entity(ent):
    # Remove punctuation
    ent = re.sub(r'[^\w\s]', '', ent).strip()
    if ent in god_aliases:
        return central_node_name
    return ent

print("Running Named Entity Recognition (NER) on chapters...")
for chapter_idx, chapter_text in enumerate(chapters):
    # Process text
    doc = nlp(chapter_text)
    
    # Extract PERSON entities
    chapter_entities = set()
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = normalize_entity(ent.text)
            if len(name) > 2 and not name.lower() in {"thou", "thee", "amen", "yea"}:
                chapter_entities.add(name)
                
    # Also explicitly search for God aliases that NER might miss
    for alias in god_aliases:
        if alias in chapter_text:
            chapter_entities.add(central_node_name)
            
    chapter_entities = list(chapter_entities)
    
    # Update nodes and counts
    for entity in chapter_entities:
        if entity not in nodes_dict:
            nodes_dict[entity] = {"id": entity, "name": entity, "val": 0}
        nodes_dict[entity]["val"] += 1
        
    # Update co-occurrences (edges)
    for i in range(len(chapter_entities)):
        for j in range(i + 1, len(chapter_entities)):
            a = chapter_entities[i]
            b = chapter_entities[j]
            # Create a sorted tuple for the edge key so (a,b) is same as (b,a)
            edge = tuple(sorted([a, b]))
            if edge not in cooccurrences:
                cooccurrences[edge] = 0
            cooccurrences[edge] += 1

# Filter out infrequent nodes to keep graph clean (e.g. appear only once)
min_occurrences = 2
filtered_nodes = [node for name, node in nodes_dict.items() if node["val"] >= min_occurrences or name == central_node_name]
valid_node_ids = {n["id"] for n in filtered_nodes}

filtered_links = []
for (a, b), weight in cooccurrences.items():
    if a in valid_node_ids and b in valid_node_ids:
        filtered_links.append({"source": a, "target": b, "weight": weight})

# Enforce central node logic: multiply Jesus/God links to make them more visually central
for link in filtered_links:
    if link["source"] == central_node_name or link["target"] == central_node_name:
        link["weight"] *= 2

graph_data = {
    "nodes": filtered_nodes,
    "links": filtered_links
}

# Output to the react app's data directory
output_dir = os.path.join(os.path.dirname(__file__), "..", "bible-network-visualizer", "src", "data")
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "john.json")

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(graph_data, f, indent=2)

print(f"Successfully generated {output_file} with {len(filtered_nodes)} nodes and {len(filtered_links)} links.")
