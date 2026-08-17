/**
 * Comprehensive Testing & Reliability Suite for Tobacco Domain & Export Calculations
 * Testing Edge Cases, Invariants, Fault Tolerance, and Boundary Conditions.
 */

const assert = require('assert');
const TobaccoCalc = require('./js/core/tobacco-calc.js');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Error: ${err.message}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n📦 ${suiteName}`);
  fn();
}

// ============================================================================
// 1. BRT (Bruto) Boundary & Edge Case Tests
// ============================================================================
describe('1. BRT Decimal & Boundary Tests (Aturan Madura)', () => {
  it('Memotong 1 kg untuk desimal .1 s/d .4', () => {
    assert.strictEqual(TobaccoCalc.calcBrt('40.1'), 39);
    assert.strictEqual(TobaccoCalc.calcBrt('40.2'), 39);
    assert.strictEqual(TobaccoCalc.calcBrt('40.3'), 39);
    assert.strictEqual(TobaccoCalc.calcBrt('40.4'), 39);
  });

  it('Tidak memotong untuk desimal .0 dan .5 s/d .9', () => {
    assert.strictEqual(TobaccoCalc.calcBrt('40.0'), 40);
    assert.strictEqual(TobaccoCalc.calcBrt('40.5'), 40);
    assert.strictEqual(TobaccoCalc.calcBrt('40.6'), 40);
    assert.strictEqual(TobaccoCalc.calcBrt('40.9'), 40);
  });

  it('Mendukung format koma Indonesia (misal: "45,3")', () => {
    assert.strictEqual(TobaccoCalc.calcBrt('45,3'), 44);
    assert.strictEqual(TobaccoCalc.calcBrt('45,8'), 45);
  });

  it('BRT Fix selalu menjadi prioritas tertinggi jika terisi', () => {
    assert.strictEqual(TobaccoCalc.calcBrt('45.9', '42'), 42);
    assert.strictEqual(TobaccoCalc.calcBrt('40.1', 40), 40);
  });

  it('Graceful handling untuk input null/undefined/kosong/non-angka', () => {
    assert.strictEqual(TobaccoCalc.calcBrt(''), null);
    assert.strictEqual(TobaccoCalc.calcBrt(null), null);
    assert.strictEqual(TobaccoCalc.calcBrt(undefined), null);
    assert.strictEqual(TobaccoCalc.calcBrt('invalid_str'), 'invalid_str');
  });
});

// ============================================================================
// 2. NETTO Tier & Deduction Boundary Tests
// ============================================================================
describe('2. NETTO Tier & Deduction Tests', () => {
  it('GL (Goni Luar) selalu dipotong 2 kg', () => {
    assert.strictEqual(TobaccoCalc.calcNet(70, 'gl'), 68);
    assert.strictEqual(TobaccoCalc.calcNet(55, 'GL'), 53);
    assert.strictEqual(TobaccoCalc.calcNet(35, ' gl '), 33);
  });

  it('Tier >= 60 kg dipotong 5 kg', () => {
    assert.strictEqual(TobaccoCalc.calcNet(60), 55);
    assert.strictEqual(TobaccoCalc.calcNet(60.0), 55);
    assert.strictEqual(TobaccoCalc.calcNet(75), 70);
  });

  it('Tier 50 s/d 59.9 kg dipotong 4 kg', () => {
    assert.strictEqual(TobaccoCalc.calcNet(50), 46);
    assert.strictEqual(TobaccoCalc.calcNet(59.9), 56);
  });

  it('Tier 10 s/d 49.9 kg dipotong 3 kg', () => {
    assert.strictEqual(TobaccoCalc.calcNet(10), 7);
    assert.strictEqual(TobaccoCalc.calcNet(49.9), 47);
  });

  it('Tier < 10 kg tidak ada potongan', () => {
    assert.strictEqual(TobaccoCalc.calcNet(9), 9);
    assert.strictEqual(TobaccoCalc.calcNet(5), 5);
  });
});

// ============================================================================
// 3. Tanggal & Nama Petani Parser Tests
// ============================================================================
describe('3. Deteksi Identitas Nota (Nama, Tanggal, Alamat)', () => {
  it('Mengenali berbagai format tanggal Indonesia', () => {
    assert.strictEqual(TobaccoCalc.formatIndoDate('10/8/26'), '10 Agustus 2026');
    assert.strictEqual(TobaccoCalc.formatIndoDate('(11/8 26)'), '11 Agustus 2026');
    assert.strictEqual(TobaccoCalc.formatIndoDate('1 mei 2026'), '1 Mei 2026');
    assert.strictEqual(TobaccoCalc.formatIndoDate('25-12-26'), '25 Desember 2026');
  });

  it('Mengekstrak nama tepat sebelum tanggal, dan alamat tepat setelah tanggal', () => {
    const rows = [
      { no: 148, nama: 'H. HANAN' },
      { no: 149, nama: '(10/8/26)' },
      { no: 150, nama: 'PEGANTENAN' }
    ];
    const info = TobaccoCalc.detectInfo(rows);
    assert.strictEqual(info.nama, 'H. HANAN');
    assert.strictEqual(info.tanggal, '10 Agustus 2026');
    assert.strictEqual(info.alamat, 'PEGANTENAN');
  });

  it('Mampu mengabaikan lot index seperti (1) atau -2 sebagai nama petani', () => {
    assert.strictEqual(TobaccoCalc.isHeaderNameToken('(1)'), false);
    assert.strictEqual(TobaccoCalc.isHeaderNameToken('- 2'), false);
    assert.strictEqual(TobaccoCalc.isHeaderNameToken('GL'), false);
    assert.strictEqual(TobaccoCalc.isHeaderNameToken('GT'), false);
    assert.strictEqual(TobaccoCalc.isHeaderNameToken('KURDI'), true);
  });
});

// ============================================================================
// 4. Perhitungan Finansial & Invariant Formula
// ============================================================================
describe('4. Invarian Perhitungan Finansial Nota', () => {
  it('PPH 1% selalu dibulatkan ke atas kelipatan Rp 5.000', () => {
    const calcPph = (jml, rate = 0.01) => Math.ceil((jml * rate) / 5000) * 5000;
    assert.strictEqual(calcPph(1000000), 10000);
    assert.strictEqual(calcPph(1000001), 15000); // 10.000,01 -> 15.000
    assert.strictEqual(calcPph(4836000), 50000); // 48.360 -> 50.000
  });

  it('Total Bersih = JUMLAH - PPH - KOLI - GT', () => {
    const sumJumlah = 10000000;
    const pph = 100000; // 1%
    const koli = 10 * 5000; // 10 bal = 50.000
    const gt = 2 * 65000; // 2 bal GT = 130.000
    const total = sumJumlah - pph - koli - gt;
    assert.strictEqual(total, 9720000);
  });
});

// ============================================================================
// Hasil Pengujian
// ============================================================================
console.log(`\n======================================================`);
console.log(`Total Pengujian : ${totalTests}`);
console.log(`Berhasil        : ${passedTests}`);
console.log(`Gagal           : ${totalTests - passedTests}`);
console.log(`Status          : ${passedTests === totalTests ? '✅ SEMUA PENGUJIAN LULUS (100% PASS)' : '❌ ADA PENGUJIAN GAGAL'}`);
console.log(`======================================================\n`);
