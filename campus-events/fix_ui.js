const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = [...walk('app'), ...walk('components')];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace primary colors
    content = content.replace(/#007AFF/ig, '#cfe467');
    content = content.replace(/#00D4FF/ig, '#e4f399');
    content = content.replace(/#0066DD/ig, '#b0c53e');
    content = content.replace(/#0055CC/ig, '#b0c53e');
    content = content.replace(/#003A8C/ig, '#b0c53e');

    // Button text dark on the new light primary color
    content = content.replace(/text-white(.*?)#cfe467/gs, 'text-[#111111]#cfe467');
    content = content.replace(/#cfe467(.*?)text-white/gs, '#cfe467-[#111111]');
    content = content.replace(/text-white transition-all/g, 'text-[#111111] transition-all');

    // Replace button pill shapes with rectangular rounded
    content = content.replace(/rounded-full/g, 'rounded-lg');
    // But revert exact w-X h-X rounded-lg back to full if they are icons/avatars
    content = content.replace(/(w-\d+\s+h-\d+\s+)rounded-lg/g, '-full');
    content = content.replace(/(w-96\s+h-96\s+)rounded-lg/g, '-full');

    if(content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});

let css = fs.readFileSync('app/globals.css', 'utf8');
if (!css.includes('prefers-color-scheme: dark')) {
    css += '\n@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #111111;\n    --card: #1C1C1E;\n    --text-primary: #F7F7F8;\n    --text-secondary: #E5E5EA;\n    --border: #38383A;\n  }\n}\n';
    fs.writeFileSync('app/globals.css', css, 'utf8');
    console.log('Updated globals.css');
}
