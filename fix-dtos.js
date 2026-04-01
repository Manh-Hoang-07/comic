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

function updateDto(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Regexp to find @IsInt()/@IsNumber() @IsOptional()? [propertyName]_id: number;
    // We target fields like location_id, parent_id, project_id, user_id, comic_id, etc.
    const patterns = [
        /(@IsInt\(\)|@IsNumber\(\))\s*\n(\s*(@[A-Za-z]+\(\)\s*\n\s*)*)([a-z0-9_]+id)\s*(\??):\s*(number|bigint)/gi,
        /(@IsInt\(\)|@IsNumber\(\))\s*\n(\s*(@[A-Za-z]+\(\)\s*\n\s*)*)([a-z0-9_]+Id)\s*(\??):\s*(number|bigint)/gi,
    ];

    for (let pattern of patterns) {
        if (content.match(pattern)) {
            content = content.replace(pattern, (match, p1, p2, p3, p4, p5, p6) => {
                // p1: @IsInt()/@IsNumber()
                // p2: other decorators
                // p4: variable name (e.g. location_id)
                // p5: optional flag
                // p6: type (number/bigint)
                
                // Exclude some common non-ID numeric fields if needed, 
                // but usually things ending in _id are IDs.
                return `@IsPrimaryKey()\n${p2}${p4}${p5}: any`;
            });
            changed = true;
        }
    }

    if (changed) {
        // Ensure IsPrimaryKey is imported from the right place
        if (!content.includes('IsPrimaryKey')) {
            // Find the last import line or just add to top
            if (content.includes("from 'class-validator'")) {
               // Add it before/after others if we want, but simpler:
               content = "import { IsPrimaryKey } from '@/common/shared/decorators';\n" + content;
            }
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed DTO:', filePath);
    }
}

walkDir('d:/comic/src/modules', function(filePath) {
    if (filePath.endsWith('.dto.ts')) {
        updateDto(filePath);
    }
});
