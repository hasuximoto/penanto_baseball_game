import xml.etree.ElementTree as ET
import traceback
import os

ns = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

def inspect_header():
    print("Inspecting header...")
    file_path = 'unit_xml/CellBall.xml'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        context = ET.iterparse(file_path, events=('start', 'end'))
        context = iter(context)
        event, root = next(context)

        in_player_sheet = False
        row_idx = -1

        for event, elem in context:
            if event == 'start' and elem.tag == f"{{{ns['table']}}}table":
                name = elem.get(f"{{{ns['table']}}}name")
                if name == '選手データ':
                    in_player_sheet = True
                    print("Found '選手データ' sheet.")
            
            if event == 'end' and elem.tag == f"{{{ns['table']}}}table":
                in_player_sheet = False
            
            if in_player_sheet and event == 'end' and elem.tag == f"{{{ns['table']}}}table-row":
                row_idx += 1
                
                cells = []
                for cell in elem.findall(f"{{{ns['table']}}}table-cell"):
                    repeated = cell.get(f"{{{ns['table']}}}number-columns-repeated")
                    count = int(repeated) if repeated else 1
                    
                    value = cell.get(f"{{{ns['office']}}}value")
                    if value is None:
                        p = cell.find(f"{{{ns['text']}}}p")
                        if p is not None:
                            value = "".join(p.itertext())
                    
                    if value is None:
                        value = ""
                    
                    for _ in range(count):
                        cells.append(value)
                
                # Print columns A(0) to AB(27) to cover AA(26)
                print(f"Row {row_idx}: {cells[:30]}") 
                
                if row_idx >= 5: # Print first 5 rows
                    break
                
                root.clear()

    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    inspect_header()
