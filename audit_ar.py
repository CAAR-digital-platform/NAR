import json
import re
import os

def audit_json(file_path, en_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        raw_content = f.read()
    
    lines = raw_content.splitlines()
    
    # 1. Detect duplicates
    keys_seen = {}
    duplicates = []
    clean_lines = []
    
    # We want to keep the LAST occurrence of a key as the "final" one
    # So we iterate backwards to find the last one, or just store all and pick the last.
    
    all_entries = []
    for i, line in enumerate(lines):
        match = re.search(r'^\s*"([^"]+)"\s*:\s*"(.*)"\s*,?\s*$', line)
        if match:
            key = match.group(1)
            val = match.group(2)
            all_entries.append({'key': key, 'val': val, 'line': i})
        elif line.strip() in ['{', '}']:
            continue
    
    final_map = {}
    dup_count = 0
    for entry in all_entries:
        if entry['key'] in final_map:
            dup_count += 1
        final_map[entry['key']] = entry['val']
    
    print(f"Total duplicates removed: {dup_count}")
    
    # 2. Compare with English
    with open(en_path, 'r', encoding='utf-8') as f:
        en_json = json.load(f)
    
    untranslated = []
    # Arabic letters range: \u0600-\u06FF
    arabic_pattern = re.compile(r'[\u0600-\u06FF]')
    
    for key, val in final_map.items():
        # If the value has no Arabic characters and it's not just numbers/symbols
        # and it matches the English value, it's likely untranslated.
        # Exceptions: Brand names like "CAAR", Variables like "{{count}}"
        
        has_arabic = bool(arabic_pattern.search(val))
        en_val = en_json.get(key, "")
        
        # If it's exactly the same as English and has no Arabic
        if not has_arabic and val == en_val and any(c.isalpha() for c in val):
            # Check if it's just a variable or brand name
            if not (val.startswith('{{') and val.endswith('}}')) and val != "CAAR":
                untranslated.append(key)
    
    print(f"Remaining untranslated keys: {len(untranslated)}")
    if untranslated:
        print("Untranslated keys:")
        for k in untranslated:
            print(f"  {k}: {final_map[k]}")
            
    # Return the data to the agent
    missing_keys = []
    for key in en_json.keys():
        if key not in final_map:
            missing_keys.append(key)
    
    print(f"Missing keys in Arabic: {len(missing_keys)}")
    if missing_keys:
        print("Missing keys:")
        for k in missing_keys:
            print(f"  {k}")
            
    return final_map, dup_count, untranslated, missing_keys

if __name__ == "__main__":
    ar_path = r'c:\Users\dell\CAAR-digital-platform\frontend\lang\ar.json'
    en_path = r'c:\Users\dell\CAAR-digital-platform\frontend\lang\en.json'
    audit_json(ar_path, en_path)
