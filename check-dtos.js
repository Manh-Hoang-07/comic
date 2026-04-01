const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const suspiciousFiles = [];

walkDir('d:/comic/src/modules', function(filePath) {
    if (filePath.endsWith('.dto.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Look for lines with @IsInt() or @IsNumber() followed by a line ending in _id: any or Id: any or similar
        // Actually, more simple: look for @_id: number or Similar
        const lines = content.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            const currentLine = lines[i].trim();
            const nextLine = lines[i+1].trim();
            if ((currentLine.includes('@IsInt()') || currentLine.includes('@IsNumber()')) && 
                (nextLine.match(/[a-z0-9_]+id/i) || nextLine.match(/[a-z0-9_]+Id/i))) {
                suspiciousFiles.push({ filePath, line: i + 1, content: currentLine + ' -> ' + nextLine });
            }
        }
    }
});

console.log(JSON.stringify(suspiciousFiles, null, 2));
