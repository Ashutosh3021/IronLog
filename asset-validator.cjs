const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'Assets');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'site.webmanifest');

function validateManifest() {
    console.log('--- Starting PWA icon validation (public/Assets/site.webmanifest) ---');

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('Error: public/Assets/site.webmanifest not found!');
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const icons = manifest.icons || [];

    if (icons.length === 0) {
        console.error('Error: No icons defined in site.webmanifest');
        return;
    }

    let has512 = false;
    let has192 = false;
    let errors = 0;

    icons.forEach((icon, index) => {
        console.log(`Checking icon ${index + 1}: ${icon.src || 'unknown source'}`);

        if (!icon.purpose) {
            console.warn(`[WARN] Icon ${index + 1} is missing "purpose" (optional for static copy).`);
        }

        if (icon.sizes === '512x512') has512 = true;
        if (icon.sizes === '192x192') has192 = true;

        if (icon.src && !icon.src.startsWith('data:')) {
            const assetPath = path.join(ASSETS_DIR, icon.src.replace(/^\//, ''));
            if (!fs.existsSync(assetPath)) {
                console.warn(`[FAIL] Icon file not found: ${assetPath}`);
                errors++;
            } else {
                console.log(`[PASS] Found ${path.basename(assetPath)}`);
            }
        }
    });

    if (!has512) {
        console.warn('[FAIL] Missing 512x512 icon entry for Android / install UI.');
        errors++;
    }
    if (!has192) {
        console.warn('[FAIL] Missing 192x192 icon entry.');
        errors++;
    }

    const requiredFiles = [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
    ];
    requiredFiles.forEach((name) => {
        const p = path.join(ASSETS_DIR, name);
        if (!fs.existsSync(p)) {
            console.warn(`[FAIL] Expected file missing: public/Assets/${name}`);
            errors++;
        }
    });

    if (errors === 0) {
        console.log('--- Validation SUCCESS ---');
    } else {
        console.error(`--- Validation FAILED: ${errors} issue(s) ---`);
    }
}

validateManifest();
