const fs = require('fs');
const sax = require('sax');

const parser = sax.createStream(true);
let inPlayerSheet = false;
let rowIdx = -1;
let currentCells = [];
let currentCellText = '';
let currentCellRepeat = 1;

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
        
        // Check for value attribute
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
        if (rowIdx < 2) {
            console.log(`Row ${rowIdx}:`);
            // Check columns used in formula
            const indices = [
                0, 2, 3, 5, 6, 18, 19, 22, 23, 24, 32, 36, 38, 52, 54, 70, 73, 74, 136, 153, 154, 161, 208
            ];
            indices.forEach(i => {
                const val = currentCells[i] || "N/A";
                let colName = "";
                // Simple column name generation (supports up to ZZ)
                if (i < 26) colName = String.fromCharCode(65 + i);
                else if (i < 702) {
                    colName = String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));
                }
                console.log(`  Col ${colName}(${i}): ${val}`);
            });
        }
        if (rowIdx >= 2) {
            process.exit(0);
        }
    }
});

const stream = fs.createReadStream('unit_xml/CellBall.xml');
stream.pipe(parser);
