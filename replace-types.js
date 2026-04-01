const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('d:/comic/src/modules', function(filePath) {
    if (filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('number | bigint') || content.includes('bigint | number')) {
            let replaced = content.replace(/number\s*\|\s*bigint/g, 'any');
            replaced = replaced.replace(/bigint\s*\|\s*number/g, 'any');
            // also replace (number | bigint)[]
            replaced = replaced.replace(/\(any\)/g, 'any'); 
            fs.writeFileSync(filePath, replaced, 'utf8');
            console.log('Modified', filePath);
        }
    }
});
