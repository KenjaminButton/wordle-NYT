import json
import re

def fix_json(input_file, output_file):
    try:
        # Initialize an empty dictionary to store our word definitions
        word_dict = {}
        
        # Read the file line by line
        with open(input_file, 'r') as f:
            content = f.readlines()
            
        # Process each line
        for line in content:
            line = line.strip()
            if not line or line in ['{', '}']:
                continue
                
            # Remove trailing commas
            line = line.rstrip(',')
            
            # Try to extract key and value using regex
            match = re.match(r'\s*"?([a-zA-Z]+)"?\s*:\s*"(.+)"', line)
            if match:
                key, value = match.groups()
                # Clean up the key and value
                key = key.strip()
                value = value.strip().replace('"', '"').replace('"', '"')
                word_dict[key] = value
            else:
                print(f"Skipping malformed line: {line}")
        
        # Write the properly formatted JSON
        with open(output_file, 'w') as f:
            json.dump(word_dict, f, indent=4)
            
        print(f"JSON file fixed successfully! Processed {len(word_dict)} words.")
        
    except Exception as e:
        print(f"Error fixing JSON: {str(e)}")
        print(f"Error occurred at line: {line}")

if __name__ == "__main__":
    fix_json('en.json', 'fixed.json')
