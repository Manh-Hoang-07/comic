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

walkDir('d:/comic/src', function(filePath) {
    if (filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        if (content.includes('number | bigint') || content.includes('bigint | number')) {
            content = content.replace(/number\s*\|\s*bigint/g, 'any');
            content = content.replace(/bigint\s*\|\s*number/g, 'any');
            changed = true;
        }

        // Also handle (string | number | bigint) -> any
        if (content.includes('string | number | bigint')) {
            content = content.replace(/string\s*\|\s*number\s*\|\s*bigint/g, 'any');
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Modified', filePath);
        }
    }
});
