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

        if (content.includes('Number(id)') || content.includes('Number(ctx.id)') || content.includes('Number(c.id)') || content.includes('Number(rc.context_id)')) {
            content = content.replace(/Number\(id\)/g, 'id');
            content = content.replace(/Number\(ctx\.id\)/g, 'ctx.id');
            content = content.replace(/Number\(c\.id\)/g, 'c.id');
            content = content.replace(/Number\(rc\.context_id\)/g, 'rc.context_id');
            changed = true;
        }
        
        if (content.includes('as number') || content.includes('as bigint')) {
             // Only replace if it looks like an ID field
             content = content.replace(/userId as number/g, 'userId');
             content = content.replace(/userId as bigint/g, 'userId');
             content = content.replace(/Auth\.id\(undefined\) as number/g, 'Auth.id(undefined)');
             changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed numeric casting:', filePath);
        }
    }
});
