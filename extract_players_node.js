const fs = require('fs');
const sax = require('sax');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'src/data/initialPlayers.json');

const teamMap = {
    'HW': 'hawks',
    'SL': 'lions',
    'FD': 'fighters',
    'OB': 'buffaloes',
    'CS': 'eagles',
    'MC': 'marines',
    'G': 'giants',
    'T': 'tigers',
    'C': 'carp',
    'D': 'dragons',
    'YB': 'baystars',
    'S': 'swallows'
};

const parser = sax.createStream(true);
let inPlayerSheet = false;
let rowIdx = -1;
let currentCells = [];
let currentCellText = '';
let currentCellRepeat = 1;
const players = [];

parser.on('opentag', (node) => {
    if (node.name === 'table:table') {
        if (node.attributes['table:name'] === '選手データ') {
            inPlayerSheet = true;
            console.log("Found '選手データ' sheet.");
        }
    }
    
    if (!inPlayerSheet) return;

    if (node.name === 'table:table-row') {
        rowIdx++;
        currentCells = [];
    }
    
    if (node.name === 'table:table-cell') {
        currentCellText = '';
        const repeat = node.attributes['table:number-columns-repeated'];
        currentCellRepeat = repeat ? parseInt(repeat, 10) : 1;
        
        if (node.attributes['office:value']) {
            currentCellText = node.attributes['office:value'];
        }
    }
});

parser.on('text', (text) => {
    if (!inPlayerSheet) return;
    currentCellText += text;
});

parser.on('closetag', (name) => {
    if (name === 'table:table') {
        inPlayerSheet = false;
    }

    if (!inPlayerSheet) return;

    if (name === 'table:table-cell') {
        for (let i = 0; i < currentCellRepeat; i++) {
            currentCells.push(currentCellText.trim());
        }
    }

    if (name === 'table:table-row') {
        if (rowIdx >= 2) { // Skip headers
            processRow(rowIdx, currentCells);
        }
    }
});

function processRow(id, cells) {
    if (!cells || cells.length === 0 || !cells[0]) return;

    const name = cells[0];
    if (name === '選手名' || name === '投球') return; // Skip if header appears again

    // Determine position (Pitcher or Fielder)
    // Check Col 5 (F) for pitch types (contains '：') or Col 25 (Z) for '投'
    let isPitcher = false;
    if (cells[5] && cells[5].includes('：')) isPitcher = true;
    if (cells[25] === '投') isPitcher = true;

    // Team ID from Col 35 (AJ)
    const teamCode = cells[35] || '';
    const team = teamMap[teamCode] || 'unknown';
    
    if (team === 'unknown') return; // Skip invalid teams

    const player = {
        id: id,
        name: name,
        team: team,
        handedness: cells[1] || 'R',
        position: isPitcher ? 'P' : 'Unknown', // Will refine later
        abilities: {},
        stats: {},
        contract: {
            salary: 1000, // Default
            yearsRemaining: 1
        }
    };

    // Extract N-V and AA
    // N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, AA=26
    
    // Common/Base stats
    // C(2): Contact/Control, D(3): Eye/Stamina, F(5): Speed/-, G(6): Defense/-
    // W(22): Power/Speed, AG(32): Fielding/-
    
    const parseFloatSafe = (val) => {
        const f = parseFloat(val);
        return isNaN(f) ? 0 : f;
    };

    if (isPitcher) {
        player.position = 'P';
        player.abilities = {
            speed: parseFloatSafe(cells[2]), // C: 球速
            control: parseFloatSafe(cells[3]), // D: 制球
            stamina: parseFloatSafe(cells[4]), // E: スタミナ (推測)
            
            // New columns
            starterAptitude: parseFloatSafe(cells[13]), // N: 先発
            relieverAptitude: parseFloatSafe(cells[14]), // O: 中継
            closerAptitude: parseFloatSafe(cells[15]), // P: 抑え
            stuff: parseFloatSafe(cells[16]), // Q: 球威
            pitchingForm: cells[17], // R: 投法
            
            correctedPower: parseFloatSafe(cells[19]), // T: 補正長打
            correctedContact: parseFloatSafe(cells[21]), // V: 補正巧打・投手
            
            overall: parseFloatSafe(cells[26]), // AA: 総合
            
            pitchTypes: []
        };
        
        // Parse pitch types from Col 5 (F)
        // Format: "スライダー：3 カーブ：2"
        if (cells[5]) {
            const parts = cells[5].split(/[\s　]+/);
            player.abilities.pitchTypes = parts.map(p => {
                const [name, val] = p.split('：');
                return name && val ? { name, value: parseInt(val) } : null;
            }).filter(p => p);
        }

    } else {
        // Fielder
        // Determine position from somewhere? 
        // Col 25 (Z) might have position for fielders too?
        const posMap = { '捕': 'C', '一': '1B', '二': '2B', '三': '3B', '遊': 'SS', '外': 'OF', '指': 'DH' };
        player.position = posMap[cells[25]] || 'DH';

        player.abilities = {
            contact: parseFloatSafe(cells[2]),
            eye: parseFloatSafe(cells[3]),
            power: parseFloatSafe(cells[4]), // E: Power
            speed: parseFloatSafe(cells[5]),
            defense: parseFloatSafe(cells[6]), // G: Defense/Fielding
            fielding: parseFloatSafe(cells[6]), // G: Defense/Fielding
            
            // New columns
            bunt: parseFloatSafe(cells[13]), // N: 犠打
            aggressiveness: parseFloatSafe(cells[14]), // O: 積極性
            steal: parseFloatSafe(cells[15]), // P: 盗塁
            trajectory: parseFloatSafe(cells[16]), // Q: 弾道
            experience: parseFloatSafe(cells[17]), // R: 実績
            pinchHitter: parseFloatSafe(cells[18]), // S: 代打
            rosterSlot: cells[19], // T: 選手枠
            arm: parseFloatSafe(cells[20]), // U: 肩
            
            overall: parseFloatSafe(cells[26]) // AA: 総合
        };

        player.aptitudes = {
            catcher: parseFloatSafe(cells[8]), // I
            first: parseFloatSafe(cells[9]),   // J
            second: parseFloatSafe(cells[10]), // K
            third: parseFloatSafe(cells[11]),  // L
            short: parseFloatSafe(cells[12]),  // M
            outfield: 0 // Default or derived?
        };
    }

    players.push(player);
}

parser.on('end', () => {
    console.log(`Extracted ${players.length} players.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(players, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
});

const stream = fs.createReadStream('unit_xml/CellBall.xml');
stream.pipe(parser);
