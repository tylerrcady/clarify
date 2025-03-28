import xml.etree.ElementTree as ET
import pandas as pd

def xml_to_csv_dynamic(xml_file, csv_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    headers = list(root[0].attrib.keys())
    
    rows = []
    for row in root.findall('row'):
        rows.append({header: row.attrib.get(header, '') for header in headers})
    
    df = pd.DataFrame(rows, columns=headers)
    df.to_csv(csv_file, index=False, encoding='utf-8')
    
    print(f"CSV file '{csv_file}' has been created successfully.")

paths = ["Badges", "Comments", "PostHistory", "PostLinks", "Posts", "Tags", "Users", "Votes"]
for p in paths:
    xml_to_csv_dynamic(f'data/ai/{p}.xml', f'data/ai/{p}.csv')