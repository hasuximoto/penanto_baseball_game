const fs = require('fs');
const sax = require('sax');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'src/data/nameMaster.json');

const parser = sax.createStream(true);
let inTargetSheet = false;
let rowIdx = -1;
let currentCells = [];
let currentCellText = '';
let currentCellRepeat = 1;

const lastNames = [];
const firstNames = [];

parser.on('opentag', (node) => {
    if (node.name === 'table:table') {
        if (node.attributes['table:name'] === 'ドラフト候補生産') {
            inTargetSheet = true;
            console.log("Found 'ドラフト候補生産' sheet.");
        }
    }
    
    if (!inTargetSheet) return;

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
    if (!inTargetSheet) return;
    currentCellText += text;
});

parser.on('closetag', (name) => {
    if (name === 'table:table') {
        inTargetSheet = false;
    }

    if (!inTargetSheet) return;

    if (name === 'table:table-cell') {
        for (let i = 0; i < currentCellRepeat; i++) {
            currentCells.push(currentCellText.trim());
        }
    }

    if (name === 'table:table-row') {
        // FA is index 156, FB is index 157
        // Check if row has enough cells
        if (currentCells.length > 157) {
            const lastName = currentCells[156];
            const firstName = currentCells[157];

            if (lastName && lastName !== '姓') {
                lastNames.push(lastName);
            }
            if (firstName && firstName !== '名') {
                firstNames.push(firstName);
            }
        }
    }
});

parser.on('end', () => {
    console.log(`Extracted ${lastNames.length} last names and ${firstNames.length} first names.`);
    const data = {
        lastNames: [...new Set(lastNames)], // Remove duplicates just in case
        firstNames: [...new Set(firstNames)]
    };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
});

const stream = fs.createReadStream('unit_xml/CellBall.xml');
stream.pipe(parser);
