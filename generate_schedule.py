import json
import datetime
import random

# Teams
CENTRAL = ['giants', 'tigers', 'dragons', 'baystars', 'carp', 'swallows']
PACIFIC = ['hawks', 'lions', 'fighters', 'buffaloes', 'eagles', 'marines']
ALL_TEAMS = CENTRAL + PACIFIC

# Settings
# Total 143 games
# Intra: 125 games (25 vs 5 opponents)
# Inter: 18 games (3 vs 6 opponents)
START_DATE = datetime.date(2026, 3, 27) # Late March start 2026 (Friday)

def generate_schedule():
    current_date = START_DATE
    
    # Fixed Rotation for 6 teams
    # Day 1: 0-5, 1-4, 2-3
    # Rotate 1-5: 0 stays, others rotate.
    def get_rotation_rounds(teams):
        rounds = []
        n = len(teams)
        moving_teams = teams[1:]
        fixed_team = teams[0]
        
        for _ in range(n - 1):
            round_matches = []
            # Fixed team match
            round_matches.append((fixed_team, moving_teams[-1]))
            
            # Others
            for i in range(len(moving_teams) // 2):
                t1 = moving_teams[i]
                t2 = moving_teams[len(moving_teams) - 2 - i]
                round_matches.append((t1, t2))
            
            rounds.append(round_matches)
            # Rotate
            moving_teams = [moving_teams[-1]] + moving_teams[:-1]
            
        return rounds

    # Generate Intra-league rounds
    # Central
    c_rounds_base = get_rotation_rounds(CENTRAL) # 5 rounds
    # Pacific
    p_rounds_base = get_rotation_rounds(PACIFIC) # 5 rounds
    
    # We need 25 games vs each opponent.
    # 8 series of 3 games = 24 games.
    # 1 series of 1 game = 1 game.
    # Total 25 games.
    
    intra_rounds = []
    
    # --- 3-game series (24 games) ---
    for cycle in range(8):
        # Shuffle order of rounds in a cycle
        c_r = c_rounds_base[:]
        p_r = p_rounds_base[:]
        random.shuffle(c_r)
        random.shuffle(p_r)
        
        for i in range(5):
            round_matches = []
            
            # Central
            for match in c_r[i]:
                if cycle % 2 == 0:
                    round_matches.append(match)
                else:
                    round_matches.append((match[1], match[0]))
            
            # Pacific
            for match in p_r[i]:
                if cycle % 2 == 0:
                    round_matches.append(match)
                else:
                    round_matches.append((match[1], match[0]))
            
            intra_rounds.append({'type': 'intra', 'matches': round_matches, 'games': 3})

    # --- 1-game series (1 game) ---
    # Add 1 extra round of matchups
    c_r_extra = c_rounds_base[:]
    p_r_extra = p_rounds_base[:]
    random.shuffle(c_r_extra)
    random.shuffle(p_r_extra)
    
    extra_intra_rounds = []
    for i in range(5):
        round_matches = []
        # Central
        for match in c_r_extra[i]:
            # Random Home/Away for the 25th game
            if random.random() > 0.5:
                round_matches.append(match)
            else:
                round_matches.append((match[1], match[0]))
        # Pacific
        for match in p_r_extra[i]:
            if random.random() > 0.5:
                round_matches.append(match)
            else:
                round_matches.append((match[1], match[0]))
        
        extra_intra_rounds.append({'type': 'intra', 'matches': round_matches, 'games': 1})

    # --- Inter-league Series Generation ---
    # 6 teams vs 6 teams.
    # 3 games vs each.
    # Total 18 games.
    
    inter_rounds = []
    p_shifted = PACIFIC[:]
    
    for i in range(6):
        round_matches = []
        for j in range(6):
            c_team = CENTRAL[j]
            p_team = p_shifted[j]
            
            # Randomize Home/Away for this single series
            # Or alternate by round index
            if i % 2 == 0:
                round_matches.append((c_team, p_team))
            else:
                round_matches.append((p_team, c_team))
        
        inter_rounds.append({'type': 'inter', 'matches': round_matches, 'games': 3})
        p_shifted = [p_shifted[-1]] + p_shifted[:-1]

    # Combine Schedule
    # Order: Intra (Part 1) -> Inter -> Intra (Part 2) -> Extra Intra
    # Intra (3-game) has 40 rounds.
    # Inter has 6 rounds.
    # Extra Intra has 5 rounds.
    
    final_rounds = []
    final_rounds.extend(intra_rounds[:15]) # ~45 games
    final_rounds.extend(inter_rounds)      # 18 games
    final_rounds.extend(intra_rounds[15:]) # ~75 games
    final_rounds.extend(extra_intra_rounds) # 5 games
    
    # Assign Dates
    schedule_data = []
    
    for r in final_rounds:
        # Determine start day
        # If current is Mon, skip to Tue
        if current_date.weekday() == 0: # Mon
            current_date += datetime.timedelta(days=1)
        
        # Series length
        num_games = r['games']
        
        # Create games for each day in series
        for day_offset in range(num_games):
            game_date = current_date + datetime.timedelta(days=day_offset)
            
            for match in r['matches']:
                schedule_data.append({
                    'date': game_date.strftime('%Y-%m-%d'),
                    'home': match[0],
                    'away': match[1],
                    'isInterleague': r['type'] == 'inter'
                })
        
        # Advance date
        current_date += datetime.timedelta(days=num_games)
        
        if current_date.weekday() == 0: # Mon
             current_date += datetime.timedelta(days=1)

    # Save
    with open('src/data/initialSchedule.json', 'w', encoding='utf-8') as f:
        json.dump(schedule_data, f, indent=2, ensure_ascii=False)
    
    print(f"Generated {len(schedule_data)} games.")

if __name__ == "__main__":
    generate_schedule()
