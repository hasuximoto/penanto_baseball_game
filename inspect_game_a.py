import xml.etree.ElementTree as ET

ns = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

def inspect_game_a():
    print("Inspecting '試合a' sheet...")
    try:
        context = ET.iterparse('unit_xml/CellBall.xml', events=('start', 'end'))
        context = iter(context)
        event, root = next(context)
        in_target_sheet = False
        row_idx = -1
        
        printed_count = 0

        for event, elem in context:
            if event == 'start' and elem.tag == f"{{{ns['table']}}}table":
                name = elem.get(f"{{{ns['table']}}}name")
                if name == '試合a':
                    in_target_sheet = True
                    print("Found '試合a' sheet")
            if event == 'end' and elem.tag == f"{{{ns['table']}}}table":
                if in_target_sheet:
                    in_target_sheet = False
                    print("End of '試合a' sheet")
                    break # Stop after processing the sheet
            
            if in_target_sheet and event == 'end' and elem.tag == f"{{{ns['table']}}}table-row":
                row_idx += 1
                
                # Limit to first 100 rows for now to see structure
                if row_idx > 100: 
                    root.clear()
                    continue

                cells_info = []
                col_idx = 0
                for cell in elem.findall(f"{{{ns['table']}}}table-cell"):
                    repeated = cell.get(f"{{{ns['table']}}}number-columns-repeated")
                    count = int(repeated) if repeated else 1
                    
                    formula = cell.get(f"{{{ns['table']}}}formula")
                    value = cell.get(f"{{{ns['office']}}}value")
                    
                    if value is None:
                        p = cell.find(f"{{{ns['text']}}}p")
                        if p is not None: value = "".join(p.itertext())
                    
                    cell_data = ""
                    if formula:
                        cell_data = f"[{col_idx}] Formula: {formula}"
                    elif value:
                        cell_data = f"[{col_idx}] Value: {value}"
                    
                    if cell_data:
                         # Only print if there is data
                         cells_info.append(cell_data)

                    col_idx += count
                
                if cells_info:
                    print(f"Row {row_idx}: {', '.join(cells_info[:5])}") # Print first 5 non-empty cells info
                    printed_count += 1

                root.clear()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_game_a()
