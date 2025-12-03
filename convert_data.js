const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'src/data/initial_players_data.json');
const OUTPUT_FILE = path.join(__dirname, 'src/data/initialPlayers.json');

const positionMap = {
    '投': 'P',
    '捕': 'C',
    '一': '1B',
    '二': '2B',
    '三': '3B',
    '遊': 'SS',
    '外': 'OF',
    'Pitcher': 'P',
    'Batter': 'DH'
};

function convert() {
    try {
        const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
        const players = JSON.parse(rawData);

        const processedPlayers = [];
        const outfieldersByTeam = {};

        players.forEach(p => {
            const newP = {};
            newP.name = p.name;
            newP.team = p.team || p.team_id || 'unknown';

            const rawPos = p.position || 'Unknown';
            const mappedPos = positionMap[rawPos] || 'Unknown';
            newP.position = mappedPos;

            newP.handedness = p.handedness || 'R';

            // Abilities
            const abilities = {};
            abilities.contact = parseFloat(p.contact || 0);
            abilities.power = parseFloat(p.power || 0);
            abilities.speed = parseFloat(p.speed || 0);
            abilities.arm = parseFloat(p.defense || 0);
            abilities.fielding = parseFloat(p.defense || 0);

            if (newP.position === 'P') {
                abilities.control = parseFloat(p.control || 0);
                abilities.stamina = parseFloat(p.stamina || 0);
                abilities.speed = parseFloat(p.speed || 0); // Pitch speed

                // Parse pitch types
                if (p.pitch_types && Array.isArray(p.pitch_types)) {
                    abilities.pitchTypes = p.pitch_types
                        .filter(pt => pt && !pt.startsWith('0：')) // Remove empty slots
                        .map(pt => {
                            const parts = pt.split('：');
                            if (parts.length === 2) {
                                return {
                                    name: parts[0],
                                    value: parseInt(parts[1], 10)
                                };
                            }
                            return null;
                        })
                        .filter(pt => pt !== null);
                } else {
                    abilities.pitchTypes = [];
                }
            }
            newP.abilities = abilities;

            // Stats
            newP.stats = {
                average: 0.0,
                homeRuns: 0,
                rbi: 0,
                stolenBases: 0,
                obp: 0.0
            };

            if (newP.position === 'P') {
                newP.stats.era = 0.0;
                newP.stats.wins = 0;
                newP.stats.losses = 0;
                newP.stats.saves = 0;
            }

            newP.age = 20;
            newP.salary = 5000000;
            newP.level = 1;
            newP.id = p.id || 0;

            newP.contract = {
                salary: newP.salary,
                yearsRemaining: 1,
                totalYears: 1,
                expirationYear: 2013
            };

            newP.careerStats = { ...newP.stats };
            newP.recentForm = [];
            newP.injuryStatus = 'healthy';
            newP.morale = 50;

            if (mappedPos === 'OF') {
                if (!outfieldersByTeam[newP.team]) {
                    outfieldersByTeam[newP.team] = [];
                }
                outfieldersByTeam[newP.team].push(newP);
            } else {
                processedPlayers.push(newP);
            }
        });

        // Process Outfielders
        console.log(`Total teams with outfielders: ${Object.keys(outfieldersByTeam).length}`);
        
        for (const team in outfieldersByTeam) {
            const ofPlayers = outfieldersByTeam[team];
            console.log(`Team: ${team}, Outfielders count: ${ofPlayers.length}`);

            // Sort by Speed (descending)
            ofPlayers.sort((a, b) => b.abilities.speed - a.abilities.speed);

            const count = ofPlayers.length;
            const cfCount = Math.max(1, Math.floor(count / 3));

            // Assign CF
            const cfs = ofPlayers.slice(0, cfCount);
            cfs.forEach(p => {
                p.position = 'CF';
                processedPlayers.push(p);
            });

            const remaining = ofPlayers.slice(cfCount);

            // Sort remaining by Arm (descending) for RF
            remaining.sort((a, b) => b.abilities.arm - a.abilities.arm);

            const rfCount = Math.max(1, Math.floor(remaining.length / 2));
            const rfs = remaining.slice(0, rfCount);
            rfs.forEach(p => {
                p.position = 'RF';
                processedPlayers.push(p);
            });

            const lfs = remaining.slice(rfCount);
            lfs.forEach(p => {
                p.position = 'LF';
                processedPlayers.push(p);
            });
        }

        // Sort by ID
        processedPlayers.sort((a, b) => a.id - b.id);

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedPlayers, null, 2), 'utf8');
        console.log(`Converted to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error('Error converting data:', err);
    }
}

convert();
