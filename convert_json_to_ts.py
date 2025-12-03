import json
import random

def convert():
    with open('src/data/initial_players_data.json', 'r', encoding='utf-8') as f:
        players = json.load(f)

    processed_players = []
    outfielders_by_team = {}

    position_map = {
        '投': 'P',
        '捕': 'C',
        '一': '1B',
        '二': '2B',
        '三': '3B',
        '遊': 'SS',
        '外': 'OF', # Temporary placeholder
        'Pitcher': 'P',
        'Batter': 'DH' 
    }

    for p in players:
        # Map fields
        new_p = {}
        new_p['name'] = p['name']
        new_p['team'] = p.get('team') or p.get('team_id', 'unknown')
        
        raw_pos = p.get('position', 'Unknown')
        mapped_pos = position_map.get(raw_pos, 'Unknown')
        new_p['position'] = mapped_pos
        
        new_p['handedness'] = p.get('handedness', 'R')
        
        # Abilities
        abilities = {}
        abilities['contact'] = float(p.get('contact', 0) or 0)
        abilities['power'] = float(p.get('power', 0) or 0)
        abilities['speed'] = float(p.get('speed', 0) or 0)
        abilities['arm'] = float(p.get('defense', 0) or 0) 
        abilities['fielding'] = float(p.get('defense', 0) or 0)
        
        # Pitcher specific
        if new_p['position'] == 'P':
             abilities['control'] = float(p.get('control', 0) or 0)
             abilities['stamina'] = float(p.get('stamina', 0) or 0)
             abilities['speed'] = float(p.get('speed', 0) or 0) # Pitch speed

        new_p['abilities'] = abilities

        # Default Stats
        new_p['stats'] = {
            'average': 0.0,
            'homeRuns': 0,
            'rbi': 0,
            'stolenBases': 0,
            'obp': 0.0
        }
        if new_p['position'] == 'P':
            new_p['stats']['era'] = 0.0
            new_p['stats']['wins'] = 0
            new_p['stats']['losses'] = 0
            new_p['stats']['saves'] = 0

        new_p['age'] = 20 # Default
        new_p['salary'] = 5000000 # Default
        new_p['level'] = 1
        
        new_p['id'] = p.get('id', 0)
        new_p['contract'] = {
            'salary': new_p['salary'],
            'yearsRemaining': 1,
            'totalYears': 1,
            'expirationYear': 2013
        }
        new_p['careerStats'] = new_p['stats'].copy()
        new_p['recentForm'] = []
        new_p['injuryStatus'] = 'healthy'
        new_p['morale'] = 50

        if mapped_pos == 'OF':
            team = new_p['team']
            if team not in outfielders_by_team:
                outfielders_by_team[team] = []
            outfielders_by_team[team].append(new_p)
        else:
            processed_players.append(new_p)

    # Process Outfielders
    for team, of_players in outfielders_by_team.items():
        # Sort by Speed (descending)
        of_players.sort(key=lambda x: x['abilities']['speed'], reverse=True)
        
        count = len(of_players)
        cf_count = max(1, count // 3)
        
        # Assign CF (Fastest)
        cfs = of_players[:cf_count]
        for p in cfs:
            p['position'] = 'CF'
            processed_players.append(p)
            
        remaining = of_players[cf_count:]
        
        # Sort remaining by Arm (Defense) for RF
        remaining.sort(key=lambda x: x['abilities']['arm'], reverse=True)
        
        rf_count = max(1, len(remaining) // 2)
        rfs = remaining[:rf_count]
        for p in rfs:
            p['position'] = 'RF'
            processed_players.append(p)
            
        lfs = remaining[rf_count:]
        for p in lfs:
            p['position'] = 'LF'
            processed_players.append(p)

    # Sort by ID to maintain order
    processed_players.sort(key=lambda x: x['id'])

    with open('src/data/initialPlayers.json', 'w', encoding='utf-8') as f:
        json.dump(processed_players, f, indent=2, ensure_ascii=False)

    print('Converted to src/data/initialPlayers.json')

if __name__ == '__main__':
    convert()

