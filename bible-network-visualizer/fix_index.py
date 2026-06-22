import os
import re

filepath = r'c:\Users\ignac\Documents\github projects\Catholic_projects\bible-network-visualizer\src\data\index.js'
with open(filepath, 'r') as f:
    content = f.read()

# Fix import names
content = re.sub(r'import (\d+_[a-z_]+) from', r'import _\1 from', content)
# Fix export names
content = re.sub(r"': (\d+_[a-z_]+),", r"': _\1,", content)

with open(filepath, 'w') as f:
    f.write(content)
print("Fixed index.js")
