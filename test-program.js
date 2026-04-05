const fs = require('fs');
const path = require('path');

function testProgram() {
    console.log('--- Starting Weekly Progression Validation ---');
    
    const filePath = path.join(__dirname, 'ironlog.html');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract PROGRAM object using regex
    const programMatch = content.match(/const PROGRAM = (\{[\s\S]*?\});/);
    if (!programMatch) {
        console.error('[FAIL] Could not extract PROGRAM definition');
        return;
    }
    
    // Parse the extracted string (need to clean it up for JSON.parse or use eval safely in this context)
    let programStr = programMatch[1]
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/(\w+):/g, '"$1":') // Quote keys
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays

    let PROGRAM;
    try {
        PROGRAM = JSON.parse(programStr);
    } catch (e) {
        console.warn('JSON parse failed, attempting direct validation via string matching...');
        // Fallback to manual string checks if parsing complex JS object fails
        validateViaString(programMatch[1]);
        return;
    }

    const expected = {
        1: { sets: [{pct:65, reps:5}, {pct:75, reps:5}, {pct:85, reps:'5+'}] },
        2: { sets: [{pct:70, reps:3}, {pct:80, reps:3}, {pct:90, reps:'3+'}] },
        3: { sets: [{pct:75, reps:5}, {pct:85, reps:3}, {pct:95, reps:'1+'}] },
        4: { sets: [{pct:40, reps:5}, {pct:50, reps:5}, {pct:60, reps:5}] }
    };

    let errors = 0;
    for (let week in expected) {
        console.log(`Checking Week ${week}...`);
        const weekData = PROGRAM[week];
        if (!weekData) {
            console.error(`[FAIL] Week ${week} missing in PROGRAM`);
            errors++;
            continue;
        }

        expected[week].sets.forEach((expSet, i) => {
            const actualSet = weekData.sets[i];
            if (!actualSet) {
                console.error(`[FAIL] Set ${i+1} missing in Week ${week}`);
                errors++;
                return;
            }

            if (actualSet.pct !== expSet.pct || actualSet.reps !== expSet.reps) {
                console.error(`[FAIL] Week ${week} Set ${i+1}: Expected ${expSet.pct}% x ${expSet.reps}, got ${actualSet.pct}% x ${actualSet.reps}`);
                errors++;
            } else {
                console.log(`[PASS] Week ${week} Set ${i+1} matches prescribed scheme.`);
            }
        });
    }

    if (errors === 0) {
        console.log('--- SUCCESS: All weekly progression schemes are correct. ---');
    } else {
        console.error(`--- FAILED: ${errors} errors found in program logic. ---`);
        process.exit(1);
    }
}

function validateViaString(str) {
    const checks = [
        { w: 1, s: 1, p: 65, r: 5 }, { w: 1, s: 2, p: 75, r: 5 }, { w: 1, s: 3, p: 85, r: "'5+'" },
        { w: 2, s: 1, p: 70, r: 3 }, { w: 2, s: 2, p: 80, r: 3 }, { w: 2, s: 3, p: 90, r: "'3+'" },
        { w: 3, s: 1, p: 75, r: 5 }, { w: 3, s: 2, p: 85, r: 3 }, { w: 3, s: 3, p: 95, r: "'1+'" },
        { w: 4, s: 1, p: 40, r: 5 }, { w: 4, s: 2, p: 50, r: 5 }, { w: 4, s: 3, p: 60, r: 5 }
    ];

    let errors = 0;
    checks.forEach(c => {
        const regex = new RegExp(`pct:${c.p},reps:${c.r}`);
        if (!str.replace(/\s/g, '').includes(`pct:${c.p},reps:${c.r}`)) {
            console.error(`[FAIL] Could not verify Week ${c.w} Set ${c.s}: ${c.p}% x ${c.r}`);
            errors++;
        } else {
            console.log(`[PASS] Verified Week ${c.w} Set ${c.s} via string match.`);
        }
    });

    if (errors === 0) {
        console.log('--- SUCCESS: All weekly progression schemes verified via string match. ---');
    } else {
        console.error(`--- FAILED: ${errors} verification errors found. ---`);
        process.exit(1);
    }
}

testProgram();
