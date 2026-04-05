const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'manifest.json');

function updateManifestIcons() {
    console.log('--- Updating manifest.json icons metadata ---');
    
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('Error: manifest.json not found!');
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    let changed = false;

    if (!manifest.icons) {
        manifest.icons = [];
        changed = true;
    }

    // Ensure each icon has a valid purpose field
    manifest.icons.forEach(icon => {
        // Remove invalid 'iscons' field if present (not a PWA spec field)
        if ('iscons' in icon) {
            console.log(`[FIX] Removing invalid "iscons" field from icon: ${icon.src}`);
            delete icon.iscons;
            changed = true;
        }
        if (!icon.purpose) {
            console.log(`[FIX] Assigning purpose: "any" to icon: ${icon.src}`);
            icon.purpose = "any";
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log('--- manifest.json updated successfully. ---');
    } else {
        console.log('--- No changes needed in manifest.json. ---');
    }
}

updateManifestIcons();