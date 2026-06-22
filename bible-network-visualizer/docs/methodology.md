# Methodology & Features

## Dataset
The source text used for this project is the **Douay-Rheims Catholic Bible**, a historic English translation of the Latin Vulgate.

## Algorithms & Data Pipeline
1. **Named Entity Recognition (NER)**: We utilized Python and the `spaCy` NLP library (specifically the `en_core_web_sm` model) to scan every verse in the Bible and extract entities tagged as `PERSON`.
2. **Heuristic Filtering**: To clean the data of NLP false positives, a strict heuristic pipeline was applied on the frontend. This instantly filters out generic terms starting with lowercase letters, pure numbers, common prefixes (like "a " or "the "), and hardcoded non-person geographic/group entities (e.g., "Hebrews", "Egyptians", "Sinai").
3. **Graph Algorithms**: A Breadth-First Search (BFS) algorithm is executed in real-time to locate the largest continuously connected component of characters in any selected book, automatically dropping disconnected subgraphs to ensure stable physics.
4. **Force-Directed Physics Engine**: The UI relies on `react-force-graph-2d` and D3-Force physics to simulate gravitational pull and charge repulsion between characters, clustering tightly-knit individuals and pushing unrelated groups apart.

## Extracted Names
For a complete list of extracted and parsed names across the entire dataset, please see [extracted_names.md](./extracted_names.md) and the accompanying CSV files.
