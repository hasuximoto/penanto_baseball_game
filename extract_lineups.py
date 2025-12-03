import json
import xml.etree.ElementTree as ET
import os

# Configuration
XML_FILE = 'unit_xml/CellBall.xml'
PLAYERS_JSON = 'src/data/initialPlayers.json'
OUTPUT_JSON = 'src/data/initialLineups.json'

# Team Mapping
# Batters: Name Col = 2 + (TeamIndex * 3), Pos Col = Name Col - 1
# Pitchers: Name Col = 1 + (TeamIndex * 2)

TEAMS = ['fighters', 'hawks', 'marines', 'buffaloes', 'lions', 'eagles']

def load_players():
    with open(PLAYERS_JSON, 'r', encoding='utf-8') as f:
        players = json.load(f)
    
    # Create lookup: (team_id, name) -> player_id
    lookup = {}
    for p in players:
        # Support both 'team' and 'team_id' for compatibility
        team = p.get('team') or p.get('team_id')
        key = (team, p['name'])
        lookup[key] = p['id']
    return lookup

def extract_lineups():
    print(f"Loading players from {PLAYERS_JSON}...")
    player_lookup = load_players()
    
    print(f"Parsing {XML_FILE}...")
    tree = ET.parse(XML_FILE)
    root = tree.getroot()
    
    # Namespaces
    ns = {
        'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
        'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
        'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
    }
    
    # Find "オーダー" sheet
    body = root.find('office:body', ns)
    spreadsheet = body.find('office:spreadsheet', ns)
    tables = spreadsheet.findall('table:table', ns)
    
    order_sheet = None
    for table in tables:
        if table.get(f"{{{ns['table']}}}name") == 'オーダー':
            order_sheet = table
            break
            
    if not order_sheet:
        print("Sheet 'オーダー' not found!")
        return

    rows = order_sheet.findall('table:table-row', ns)
    
    # Helper to get cell text
    def get_cell_text(row, col_idx):
        cells = []
        for cell in row.findall('table:table-cell', ns):
            repeat = int(cell.get(f"{{{ns['table']}}}number-columns-repeated", 1))
            text_p = cell.find('text:p', ns)
            text = text_p.text if text_p is not None else ""
            for _ in range(repeat):
                cells.append(text)
        
        if col_idx < len(cells):
            return cells[col_idx]
        return ""

    lineups = {}

    for i, team_id in enumerate(TEAMS):
        print(f"Processing {team_id}...")
        batting_order = []
        pitching_rotation = []
        
        # Calculate columns
        batter_name_col = 2 + (i * 3)
        batter_pos_col = batter_name_col - 1
        pitcher_name_col = 1 + (i * 2)
        
        # Extract Batting Order (Rows 1-9 -> Indices 1-9)
        for r in range(1, 10):
            if r >= len(rows): break
            row = rows[r]
            name = get_cell_text(row, batter_name_col)
            pos = get_cell_text(row, batter_pos_col)
            
            if name:
                player_id = player_lookup.get((team_id, name))
                if player_id:
                    batting_order.append({
                        "order": r,
                        "position": pos,
                        "playerId": player_id,
                        "name": name
                    })
                else:
                    print(f"  Warning: Batter {name} not found for {team_id}")

        # Extract Starting Pitchers (Rows 17-22 -> Indices 17-22)
        for r in range(17, 23):
            if r >= len(rows): break
            row = rows[r]
            name = get_cell_text(row, pitcher_name_col)
            
            if name:
                player_id = player_lookup.get((team_id, name))
                if player_id:
                    pitching_rotation.append({
                        "rotationOrder": r - 16,
                        "playerId": player_id,
                        "name": name
                    })
                else:
                    print(f"  Warning: Pitcher {name} not found for {team_id}")

        lineups[team_id] = {
            "battingOrder": batting_order,
            "pitchingRotation": pitching_rotation
        }

    print(f"Saving lineups to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(lineups, f, indent=2, ensure_ascii=False)
    print("Done.")

if __name__ == "__main__":
    extract_lineups()
