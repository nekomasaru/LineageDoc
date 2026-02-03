const fs = require('fs');
const path = 'src/app/page.tsx';

try {
    let content = fs.readFileSync(path, 'utf8');

    // Remove the Zoom button block using regex that matches the structure
    // Matches <button ... toggleSidebarZoom ... </button> across multiple lines
    const buttonRegex = /<button\s+onClick=\{toggleSidebarZoom\}[\s\S]*?<\/button>/;

    if (buttonRegex.test(content)) {
        console.log('Found zoom button block. Removing...');
        content = content.replace(buttonRegex, '');
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully removed zoom button block.');
    } else {
        console.log('Zoom button block not found.');
    }

} catch (e) {
    console.error('Error:', e);
}
