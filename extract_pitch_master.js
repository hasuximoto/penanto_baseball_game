const fs = require('fs');
const readline = require('readline');
const path = require('path');

const filePath = path.join(__dirname, 'unit_xml/CellBall.xml');
const outputPath = path.join(__dirname, 'src/data/pitch_master.json');

async function extractPitchMaster() {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let inSheet3 = false;
    let inRow = false;
    let inCell = false;
    let currentRow = [];
    let rows = [];
    
    let currentCellValue = null;
    let currentCellRepeat = 1;

    const tableStartRegex = /<table:table[^>]*table:name="Sheet3"/;
    const tableEndRegex = /<\/table:table>/;
    const rowStartRegex = /<table:table-row/;
    const rowEndRegex = /<\/table:table-row>/;
    
    // Regex for cell start/end
    const cellStartRegex = /<table:table-cell([^>]*)>/;
    const cellEndRegex = /<\/table:table-cell>/;
    const cellSelfClosingRegex = /<table:table-cell([^>]*)\/>/;

    for await (const line of rl) {
        if (!inSheet3) {
            if (tableStartRegex.test(line)) {
                inSheet3 = true;
                console.log("Found Sheet3");
            }
            continue;
        }

        if (tableEndRegex.test(line)) {
            inSheet3 = false;
            console.log("End of Sheet3");
            break;
        }

        if (rowStartRegex.test(line)) {
            inRow = true;
            currentRow = [];
            continue;
        }

        if (rowEndRegex.test(line)) {
            inRow = false;
            if (currentRow.length >= 3) {
                rows.push(currentRow);
            }
            continue;
        }

        if (inRow) {
            // Check for self-closing cell first
            const selfClosingMatch = line.match(cellSelfClosingRegex);
            if (selfClosingMatch) {
                const attributes = selfClosingMatch[1];
                let val = null;
                const valMatch = attributes.match(/office:value="([^"]*)"/);
                const strMatch = attributes.match(/office:string-value="([^"]*)"/);
                
                if (valMatch) val = valMatch[1];
                else if (strMatch) val = strMatch[1];
                
                const repeatMatch = attributes.match(/table:number-columns-repeated="(\d+)"/);
                const repeat = repeatMatch ? parseInt(repeatMatch[1]) : 1;
                
                for(let i=0; i<repeat; i++) currentRow.push(val);
                continue;
            }

            // Check for cell start
            const cellStartMatch = line.match(cellStartRegex);
            if (cellStartMatch) {
                inCell = true;
                currentCellValue = null;
                currentCellRepeat = 1;
                
                const attributes = cellStartMatch[1];
                const valMatch = attributes.match(/office:value="([^"]*)"/);
                const strMatch = attributes.match(/office:string-value="([^"]*)"/);
                const repeatMatch = attributes.match(/table:number-columns-repeated="(\d+)"/);
                
                if (valMatch) currentCellValue = valMatch[1];
                else if (strMatch) currentCellValue = strMatch[1];
                
                if (repeatMatch) currentCellRepeat = parseInt(repeatMatch[1]);
                
                // If line also has end tag
                if (cellEndRegex.test(line)) {
                    // Check for text content if value is null
                    if (currentCellValue === null) {
                        const textMatch = line.match(/<text:p>([^<]*)<\/text:p>/);
                        if (textMatch) currentCellValue = textMatch[1];
                    }
                    
                    for(let i=0; i<currentCellRepeat; i++) currentRow.push(currentCellValue);
                    inCell = false;
                }
                continue;
            }
            
            if (inCell) {
                // Look for text content
                if (currentCellValue === null) {
                    const textMatch = line.match(/<text:p>([^<]*)<\/text:p>/);
                    if (textMatch) currentCellValue = textMatch[1];
                }
                
                // Look for cell end
                if (cellEndRegex.test(line)) {
                    for(let i=0; i<currentCellRepeat; i++) currentRow.push(currentCellValue);
                    inCell = false;
                }
            }
        }
    }

    console.log('Extracted ' + rows.length + ' rows.');
    
    // Process rows to extract pitch data
    // Column A: Name (index 0)
    // Column B: Ground Ball Mod (index 1)
    // Column C: Whiff Mod (index 2)
    
    const pitchData = [];
    
    rows.forEach(row => {
        if (row.length < 3) return;
        
        const name = row[0];
        const groundBallMod = parseFloat(row[1]);
        const whiffMod = parseFloat(row[2]);
        
        if (name && !isNaN(groundBallMod) && !isNaN(whiffMod)) {
            pitchData.push({
                name: name,
                groundBallMod: groundBallMod,
                whiffMod: whiffMod
            });
        }
    });
    
    console.log('Found ' + pitchData.length + ' valid pitch entries.');
    console.log('Sample:', pitchData.slice(0, 5));
    
    fs.writeFileSync(outputPath, JSON.stringify(pitchData, null, 2));
    console.log('Saved to ' + outputPath);
}

extractPitchMaster();
