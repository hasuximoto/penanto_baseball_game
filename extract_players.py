import xml.etree.ElementTree as ET
import json
import re

ns = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

def extract_data():
    print("Starting extraction...")
    players = []
    
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
                
                # Skip header rows
                if row_idx < 2:
                    continue

                cells = []
                
                for cell in elem.findall(f"{{{ns['table']}}}table-cell"):
                    repeated = cell.get(f"{{{ns['table']}}}number-columns-repeated")
                    count = int(repeated) if repeated else 1
                    
                    value = cell.get(f"{{{ns['office']}}}value")
                    if value is None:
                        p = cell.find(f"{{{ns['text']}}}p")
                        if p is not None:
                            value = "".join(p.itertext())
                    
                    # Normalize value
                    if value is None:
                        value = ""
                    
                    for _ in range(count):
                        cells.append(value)
                
                # Basic validation: Must have a name at index 0
                if not cells or not str(cells[0]).strip():
                    root.clear()
                    continue

                # Determine if Pitcher or Batter
                # Pitchers have pitch types (strings with ':') in col 5
                is_pitcher = False
                if len(cells) > 5 and '：' in str(cells[5]):
                    is_pitcher = True
                # Also check explicit position column (index 25)
                elif len(cells) > 25 and str(cells[25]).strip() == '投':
                    is_pitcher = True
                
                player = {}
                player['id'] = row_idx  # Use row index as ID
                player['name'] = cells[0]
                player['handedness'] = cells[1] if len(cells) > 1 else ""

                # Extract Team ID
                # Mapping based on Column 35 (AJ)
                # HW: Hawks, MC: Marines, CS: Eagles, OB: Buffaloes, FD: Fighters, SL: Lions
                team_map = {
                    'HW': 'hawks',
                    'SL': 'lions',
                    'FD': 'fighters',
                    'OB': 'buffaloes',
                    'CS': 'eagles',
                    'MC': 'marines'
                }
                
                # Use Column 35 (AJ) for Team ID
                team_code = str(cells[35]).strip() if len(cells) > 35 else ""
                
                # Skip if team_code is not in map (e.g. '0')
                if team_code not in team_map:
                    root.clear()
                    continue
                
                player['team'] = team_map.get(team_code, 'unknown')

                # Extract Fatigue (BS - 70) and Recovery (BU - 72)
                try:
                    player['fatigue'] = float(cells[70]) if len(cells) > 70 and cells[70] != "" else 0
                    player['recovery'] = float(cells[72]) if len(cells) > 72 and cells[72] != "" else 0
                except ValueError:
                    player['fatigue'] = 0
                    player['recovery'] = 0

                player['abilities'] = {}

                def safe_float(val):
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        return 0.0

                if is_pitcher:
                    player['position'] = 'P'
                    player['abilities']['speed'] = safe_float(cells[2]) if len(cells) > 2 else 0
                    player['abilities']['control'] = safe_float(cells[3]) if len(cells) > 3 else 0
                    player['abilities']['stamina'] = safe_float(cells[4]) if len(cells) > 4 else 0
                    
                    pitch_types = []
                    for i in range(5, 13):
                        if i < len(cells) and cells[i] and str(cells[i]) != '0' and '：' in str(cells[i]):
                            parts = str(cells[i]).split('：')
                            if len(parts) == 2:
                                try:
                                    p_name = parts[0].strip()
                                    p_value = float(parts[1])
                                    if p_name != "0" and p_value > 0:
                                        pitch_types.append({
                                            "name": p_name,
                                            "value": p_value
                                        })
                                except ValueError:
                                    pass
                    player['abilities']['pitchTypes'] = pitch_types
                    
                    player['starter_aptitude'] = safe_float(cells[13]) if len(cells) > 13 else 0
                    player['reliever_aptitude'] = safe_float(cells[14]) if len(cells) > 14 else 0
                    player['closer_aptitude'] = safe_float(cells[15]) if len(cells) > 15 else 0
                    player['stuff'] = safe_float(cells[16]) if len(cells) > 16 else 0
                    player['form'] = safe_float(cells[17]) if len(cells) > 17 else 0
                    
                else:
                    # Batter
                    # Determine main position from aptitude columns or Col 25 if available
                    # For now, just label as Batter, or try to infer from highest aptitude
                    player['position'] = 'Batter' # Default
                    
                    # Try to find specific position from Col 25 if it exists and is valid
                    if len(cells) > 25:
                        pos_val = str(cells[25]).strip()
                        pos_map = {
                            '捕': 'C',
                            '一': '1B',
                            '二': '2B',
                            '三': '3B',
                            '遊': 'SS',
                            '外': 'OF'
                        }
                        if pos_val in pos_map:
                            player['position'] = pos_map[pos_val]
                    
                    player['abilities']['contact'] = safe_float(cells[2]) if len(cells) > 2 else 0
                    player['abilities']['eye'] = safe_float(cells[3]) if len(cells) > 3 else 0
                    player['abilities']['power'] = safe_float(cells[4]) if len(cells) > 4 else 0
                    player['abilities']['speed'] = safe_float(cells[5]) if len(cells) > 5 else 0
                    player['abilities']['fielding'] = safe_float(cells[6]) if len(cells) > 6 else 0
                    # Multiply arm by 3 as requested
                    player['abilities']['arm'] = (safe_float(cells[20]) if len(cells) > 20 else 0) * 3
                    player['abilities']['bunt'] = safe_float(cells[13]) if len(cells) > 13 else 0
                    
                    # Aptitudes
                    player['aptitudes'] = {
                        'catcher': safe_float(cells[7]) if len(cells) > 7 else 0,
                        'first': safe_float(cells[8]) if len(cells) > 8 else 0,
                        'second': safe_float(cells[9]) if len(cells) > 9 else 0,
                        'third': safe_float(cells[10]) if len(cells) > 10 else 0,
                        'short': safe_float(cells[11]) if len(cells) > 11 else 0,
                        'outfield': safe_float(cells[12]) if len(cells) > 12 else 0
                    }

                players.append(player)
                root.clear()

        # --- Post-processing: Assign Initial Registration Status ---
        # Group by team
        teams = {}
        for p in players:
            t = p.get('team', 'unknown')
            if t not in teams:
                teams[t] = []
            teams[t].append(p)
        
        for team_id, team_players in teams.items():
            pitchers = [p for p in team_players if p.get('position') == 'P']
            fielders = [p for p in team_players if p.get('position') != 'P']
            
            # Calculate simple score for sorting
            def get_pitcher_score(p):
                ab = p.get('abilities', {})
                return (ab.get('speed', 0) + ab.get('control', 0) + ab.get('stamina', 0)) / 3
            
            def get_fielder_score(p):
                ab = p.get('abilities', {})
                return (ab.get('contact', 0) + ab.get('power', 0) + ab.get('fielding', 0) + ab.get('speed', 0)) / 4

            pitchers.sort(key=get_pitcher_score, reverse=True)
            fielders.sort(key=get_fielder_score, reverse=True)
            
            # Assign Active/Farm
            # Target: 13 Pitchers, 18 Fielders (Total 31)
            for i, p in enumerate(pitchers):
                p['registrationStatus'] = 'active' if i < 13 else 'farm'
            
            for i, p in enumerate(fielders):
                p['registrationStatus'] = 'active' if i < 18 else 'farm'

        # Save to JSON
        with open('src/data/initialPlayers.json', 'w', encoding='utf-8') as f:
            json.dump(players, f, indent=2, ensure_ascii=False)
        
        print(f"Extracted {len(players)} players.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    extract_data()
