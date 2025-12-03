const fs = require('fs');
const sax = require('sax');
const path = require('path');

const parser = sax.createStream(true);
let inTargetSheet = false;
let rowIdx = -1;
let currentCells = [];
let currentCellText = '';
let currentCellRepeat = 1;
let currentCellFormula = '';

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
        currentCellFormula = node.attributes['table:formula'] || '';
        
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
            currentCells.push({
                text: currentCellText.trim(),
                formula: currentCellFormula
            });
        }
    }

    if (name === 'table:table-row') {
        // 野手は3行目 (index 2), 投手は101行目 (index 100)
        if (rowIdx === 2) {
            console.log('--- Fielder Row (Row 3) ---');
            currentCells.forEach((cell, idx) => {
                if (idx < 150) { // Limit output
                    console.log(`Col ${idx}: Val=[${cell.text}] Formula=[${cell.formula}]`);
                }
            });
        }
        if (rowIdx === 100) {
            console.log('--- Pitcher Row (Row 101) ---');
            currentCells.forEach((cell, idx) => {
                if (idx < 150) { // Limit output
                    console.log(`Col ${idx}: Val=[${cell.text}] Formula=[${cell.formula}]`);
                }
            });
        }
    }
});

const stream = fs.createReadStream('unit_xml/CellBall.xml');
stream.pipe(parser);
