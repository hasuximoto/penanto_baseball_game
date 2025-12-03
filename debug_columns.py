import xml.etree.ElementTree as ET

ns = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

def debug_columns():
    print("Debugging columns...")
    
    try:
        context = ET.iterparse('unit_xml/CellBall.xml', events=('start', 'end'))
        context = iter(context)
        event, root = next(context)

        in_player_sheet = False
        row_idx = -1

        for event, elem in context:
            if event == 'start' and elem.tag == f"{{{ns['table']}}}table":
                name = elem.get(f"{{{ns['table']}}}name")
                if name == '選手データ':
                    in_player_sheet = True
            
            if event == 'end' and elem.tag == f"{{{ns['table']}}}table":
                in_player_sheet = False
            
            if in_player_sheet and event == 'end' and elem.tag == f"{{{ns['table']}}}table-row":
                row_idx += 1
                
                # Check first few rows for headers
                cells = []
                for cell in elem.findall(f"{{{ns['table']}}}table-cell"):
                    repeated = cell.get(f"{{{ns['table']}}}number-columns-repeated")
                    count = int(repeated) if repeated else 1
                    
                    value = cell.get(f"{{{ns['office']}}}value")
                    if value is None:
                        p = cell.find(f"{{{ns['text']}}}p")
                        if p is not None:
                            value = "".join(p.itertext())
                    if value is None: value = ""
                    
                    for _ in range(count):
                        cells.append(value)
                
                if row_idx < 5:
                    print(f"Row {row_idx}: {cells[:40]}")
                
                if row_idx > 20:
                    break
                
                root.clear()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_columns()
