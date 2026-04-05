const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'manifest.json');

function validateManifest() {
    console.log('--- Starting PWA Icon Validation ---');
    
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('Error: manifest.json not found!');
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const icons = manifest.icons || [];

    if (icons.length === 0) {
        console.error('Error: No icons defined in manifest.json');
        return;
    }

    let has512 = false;
    let has1024 = false;
    let errors = 0;

    icons.forEach((icon, index) => {
        console.log(`Checking icon ${index + 1}: ${icon.src || 'unknown source'}`);

        // 1. Check metadata (purpose) — required by PWA spec
        if (!icon.purpose) {
            console.warn(`[FAIL] Icon ${index + 1} is missing the "purpose" metadata!`);
            errors++;
        } else {
            console.log(`[PASS] Icon ${index + 1} has "purpose" metadata.`);
        }

        // 3. Check dimensions
        if (icon.sizes === '512x512') has512 = true;
        if (icon.sizes === '1024x1024') has1024 = true;

        // 4. Check file existence if it's not a data-URI
        if (icon.src && !icon.src.startsWith('data:')) {
            const assetPath = path.join(__dirname, icon.src);
            if (!fs.existsSync(assetPath)) {
                console.warn(`[FAIL] Icon file not found: ${icon.src}`);
                errors++;
            }
        }
    });

    // Final checks for platform requirements
    if (!has512) {
        console.warn('[FAIL] Missing mandatory 512x512px icon for Android.');
        errors++;
    }
    if (!has1024) {
        console.warn('[FAIL] Missing mandatory 1024x1024px icon for iOS.');
        errors++;
    }

    if (errors === 0) {
        console.log('--- Validation SUCCESS: All app download logos are properly configured. ---');
    } else {
        console.error(`--- Validation FAILED: ${errors} errors found. ---`);
    }
}

validateManifest();