import urllib.request
import json
import csv
import os
import glob

# 1. Benchmark data
benchmark_names = set()
try:
    print("Attempting to download benchmark data...")
    url = "https://raw.githubusercontent.com/Daniel-Hug/bible-people/master/data/people.csv"
    response = urllib.request.urlopen(url)
    lines = [l.decode('utf-8') for l in response.readlines()]
    reader = csv.DictReader(lines)
    for row in reader:
        name = row.get("name", "").strip()
        if name:
            benchmark_names.add(name.lower())
except Exception as e:
    print(f"Warning: Could not download external dataset ({e}). Using local baseline.")

# Fallback explicit names
custom_valid_names = {"john the baptist", "jesus", "god", "christ", "lord", "holy ghost", "father", "messias", "paraclete", "peter", "paul", "mary", "joseph", "john", "matthew", "luke", "mark", "david", "solomon", "moses", "abraham", "isaac", "jacob", "noah"}
benchmark_names.update(custom_valid_names)

# 2. Read all generated JSON files
data_dir = os.path.join(os.path.dirname(__file__), "..", "bible-network-visualizer", "src", "data")
json_files = glob.glob(os.path.join(data_dir, "*.json"))

book_people = []
all_people_dict = {}

print("Cross-referencing extracted names...")

for file in json_files:
    book_id = os.path.basename(file).replace(".json", "")
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for node in data.get("nodes", []):
        name = node["name"]
        val = node["val"]
        
        is_real = name.lower() in benchmark_names
        
        # Track by book
        book_people.append({
            "Book": book_id,
            "Person": name,
            "Occurrences": val,
            "Is_Real_Biblical_Name": is_real
        })
        
        # Track globally
        if name not in all_people_dict:
            all_people_dict[name] = {
                "Person": name,
                "Total_Occurrences": 0,
                "Books_Appeared_In": set(),
                "Is_Real_Biblical_Name": is_real
            }
        
        all_people_dict[name]["Total_Occurrences"] += val
        all_people_dict[name]["Books_Appeared_In"].add(book_id)

# 3. Export to CSV
export_dir = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(export_dir, exist_ok=True)

# Export people_by_book.csv
book_csv_path = os.path.join(export_dir, "people_by_book.csv")
with open(book_csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["Book", "Person", "Occurrences", "Is_Real_Biblical_Name"])
    writer.writeheader()
    book_people_sorted = sorted(book_people, key=lambda x: (x["Book"], -x["Occurrences"]))
    for row in book_people_sorted:
        writer.writerow(row)

# Export all_people.csv
all_csv_path = os.path.join(export_dir, "all_people.csv")
with open(all_csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["Person", "Total_Occurrences", "Number_Of_Books", "Is_Real_Biblical_Name"])
    writer.writeheader()
    all_people_list = list(all_people_dict.values())
    all_people_sorted = sorted(all_people_list, key=lambda x: -x["Total_Occurrences"])
    for row in all_people_sorted:
        writer.writerow({
            "Person": row["Person"],
            "Total_Occurrences": row["Total_Occurrences"],
            "Number_Of_Books": len(row["Books_Appeared_In"]),
            "Is_Real_Biblical_Name": row["Is_Real_Biblical_Name"]
        })

print(f"Export complete! Found {len(all_people_list)} unique people.")
print(f"CSVs saved to: {export_dir}")
