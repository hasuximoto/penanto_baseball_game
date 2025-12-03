const fs = require('fs');
const sax = require('sax');

const parser = sax.createStream(true);
let inPlayerSheet = false;
let rowIdx = -1;
let currentCellIndex = 0;

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
        currentCellIndex = 0;
    }
    
    if (node.name === 'table:table-cell') {
        const repeat = node.attributes['table:number-columns-repeated'];
        const count = repeat ? parseInt(repeat, 10) : 1;
        
        // Check if this cell covers AA (Index 26)
        if (currentCellIndex <= 26 && currentCellIndex + count > 26) {
            // This is the cell for AA
            const formula = node.attributes['table:formula'];
            const value = node.attributes['office:value'];
            
            if (rowIdx >= 2 && rowIdx < 10) { // Check first few data rows
                console.log(`Row ${rowIdx}, Col AA Formula: ${formula}`);
                console.log(`Row ${rowIdx}, Col AA Value: ${value}`);
            }
        }
        
        currentCellIndex += count;
    }
});

parser.on('closetag', (name) => {
    if (name === 'table:table') {
        inPlayerSheet = false;
    }
    
    if (name === 'table:table-row' && rowIdx >= 10) {
        process.exit(0);
    }
});

const stream = fs.createReadStream('unit_xml/CellBall.xml');
stream.pipe(parser);
