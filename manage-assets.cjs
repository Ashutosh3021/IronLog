const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'public', 'Assets', 'site.webmanifest');

function updateManifestIcons() {
    console.log('--- Updating public/Assets/site.webmanifest icon metadata ---');

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('Error: public/Assets/site.webmanifest not found!');
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    let changed = false;

    if (!manifest.icons) {
        manifest.icons = [];
        changed = true;
    }

    manifest.icons.forEach((icon) => {
        if ('iscons' in icon) {
            console.log(`[FIX] Removing invalid "iscons" field from icon: ${icon.src}`);
            delete icon.iscons;
            changed = true;
        }
        if (!icon.purpose) {
            console.log(`[FIX] Assigning purpose: "any" to icon: ${icon.src}`);
            icon.purpose = 'any';
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log('--- site.webmanifest updated successfully. ---');
    } else {
        console.log('--- No changes needed in site.webmanifest. ---');
    }
}

updateManifestIcons();
