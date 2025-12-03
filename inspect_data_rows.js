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
        if (rowIdx >= 2 && rowIdx < 7) { // Check first 5 data rows
            console.log(`Row ${rowIdx}:`);
            // Check W(22), X(23), FF(161)
            const valW = currentCells[22] || "N/A";
            const valX = currentCells[23] || "N/A";
            const valFF = currentCells[161] || "N/A";
            console.log(`  Col W(22): ${valW}`);
            console.log(`  Col X(23): ${valX}`);
            console.log(`  Col FF(161): ${valFF}`);
            
            // Check Name(0) and Position(25) to identify player type
            console.log(`  Name: ${currentCells[0]}, Pos: ${currentCells[25]}`);
        }
        if (rowIdx >= 7) {
            process.exit(0);
        }
    }
});

const stream = fs.createReadStream('unit_xml/CellBall.xml');
stream.pipe(parser);
