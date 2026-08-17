/**
 * TobaccoCalc Unit Test Suite
 */
const assert = require('assert');
const TobaccoCalc = require('./js/core/tobacco-calc.js');

console.log('Testing TobaccoCalc Core Module...');

// 1. Test Decimal BRT Deduction
assert.strictEqual(TobaccoCalc.calcBrt('45.2'), 44, '45.2 should be 44 (dec <= 0.4)');
assert.strictEqual(TobaccoCalc.calcBrt('45.4'), 44, '45.4 should be 44 (dec <= 0.4)');
assert.strictEqual(TobaccoCalc.calcBrt('45.5'), 45, '45.5 should be 45 (dec > 0.4)');
assert.strictEqual(TobaccoCalc.calcBrt('45.9'), 45, '45.9 should be 45 (dec > 0.4)');
assert.strictEqual(TobaccoCalc.calcBrt('45.0'), 45, '45.0 should be 45');
// With brtFix
assert.strictEqual(TobaccoCalc.calcBrt('45.9', '43'), 43, 'brtFix should override');

// 2. Test Netto Calculation
// GL
assert.strictEqual(TobaccoCalc.calcNet(45, 'gl'), 43, 'GL 45 -> 43 (BRT - 2)');
// Weight tiers
assert.strictEqual(TobaccoCalc.calcNet(65), 60, 'BRT 65 -> 60 (BRT - 5)');
assert.strictEqual(TobaccoCalc.calcNet(55), 51, 'BRT 55 -> 51 (BRT - 4)');
assert.strictEqual(TobaccoCalc.calcNet(45), 42, 'BRT 45 -> 42 (BRT - 3)');
assert.strictEqual(TobaccoCalc.calcNet(8), 8, 'BRT 8 -> 8 (BRT < 10)');

// 3. Test Harga
assert.strictEqual(TobaccoCalc.calcHarga('55'), 55000, 'Grade 55 -> 55000');
assert.strictEqual(TobaccoCalc.calcHarga('40.5'), 40500, 'Grade 40.5 -> 40500');

// 4. Test Date Formatting
assert.strictEqual(TobaccoCalc.formatIndoDate('10/8/26'), '10 Agustus 2026', '10/8/26 -> 10 Agustus 2026');
assert.strictEqual(TobaccoCalc.formatIndoDate('15-05-2026'), '15 Mei 2026', '15-05-2026 -> 15 Mei 2026');

// 5. Test detectInfo
const sampleRows = [
  { no: 1, nama: 'H. HANAN' },
  { no: 2, nama: '10/8/26' },
  { no: 3, nama: 'PEGANTENAN' }
];
const info = TobaccoCalc.detectInfo(sampleRows);
assert.strictEqual(info.nama, 'H. HANAN');
assert.strictEqual(info.tanggal, '10 Agustus 2026');
assert.strictEqual(info.alamat, 'PEGANTENAN');

console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
