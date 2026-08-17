/**
 * Tobacco Calculation & Domain Rules Engine (Core Module)
 * Pure domain logic for Madura tobacco sorting, deductions, date formatting, and BS detection.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TobaccoCalc = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BULAN = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const BULAN_MAP = {
    jan: 1, januari: 1,
    feb: 2, februari: 2,
    mar: 3, maret: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6,
    jul: 7, juli: 7,
    agu: 8, ags: 8, agust: 8, agustus: 8, aug: 8,
    sep: 9, september: 9,
    okt: 10, oktober: 10, oct: 10,
    nop: 11, nov: 11, november: 11,
    des: 12, desember: 12, dec: 12
  };

  const DATE_RE = /^\(?\s*(\d{1,2})\s*[\/\-.\\ ]\s*(\d{1,2})\s*[\/\-.\\ ]\s*(\d{2,4})\s*\)?$/;
  const TEXT_DATE_RE = /^\(?\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})\s*\)?$/;

  function roundInt(x) {
    if (x === null || x === undefined || x === '') return x;
    const xf = parseFloat(x);
    if (isNaN(xf)) return x;
    return xf >= 0 ? Math.floor(xf + 0.5) : -Math.floor(-xf + 0.5);
  }

  function calcBrt(kg, brtFix) {
    if (brtFix !== null && brtFix !== undefined && String(brtFix).trim() !== '') {
      return roundInt(brtFix);
    }
    if (kg === null || kg === undefined || String(kg).trim() === '') return null;
    const kf = parseFloat(String(kg).replace(',', '.'));
    if (isNaN(kf)) return kg;
    const dec = Math.round((kf % 1) * 10) / 10;
    if (dec > 0 && dec <= 0.4) {
      return Math.floor(kf) - 1;
    }
    return Math.floor(kf);
  }

  function calcHarga(grade, harga) {
    if (harga !== null && harga !== undefined && String(harga).trim() !== '') {
      const hStr = String(harga).trim();
      if (!hStr.startsWith('=')) {
        const hf = parseFloat(hStr.replace(/[^\d.-]/g, ''));
        if (!isNaN(hf)) return roundInt(hf);
      }
    }
    if (grade !== null && grade !== undefined && String(grade).trim() !== '') {
      const gStr = String(grade).replace(/[^\d.-]/g, '');
      const gf = parseFloat(gStr);
      if (!isNaN(gf)) return roundInt(gf * 1000);
    }
    return harga;
  }

  function calcNet(brt, gl) {
    if (brt === null || brt === undefined || String(brt).trim() === '') return null;
    const b = parseFloat(brt);
    if (isNaN(b)) return brt;
    const isGl = String(gl || '').trim().toLowerCase() === 'gl';
    if (isGl) return roundInt(b - 2);
    if (b >= 60) return roundInt(b - 5);
    if (b >= 50) return roundInt(b - 4);
    if (b >= 10) return roundInt(b - 3);
    return roundInt(b);
  }

  function isDateToken(v) {
    if (!v) return false;
    const s = String(v).trim();
    if (DATE_RE.test(s)) return true;
    const m = s.match(TEXT_DATE_RE);
    return Boolean(m && BULAN_MAP[m[2].toLowerCase()]);
  }

  function formatIndoDate(v) {
    if (!v) return '';
    const s = String(v).trim();
    let m = s.match(DATE_RE);
    if (m) {
      let d = parseInt(m[1], 10);
      let mth = parseInt(m[2], 10);
      let y = parseInt(m[3], 10);
      if (y < 100) y += 2000;
      mth = Math.min(Math.max(mth, 1), 12);
      return `${d} ${BULAN[mth]} ${y}`;
    }
    m = s.match(TEXT_DATE_RE);
    if (m && BULAN_MAP[m[2].toLowerCase()]) {
      let d = parseInt(m[1], 10);
      let mth = BULAN_MAP[m[2].toLowerCase()];
      let y = parseInt(m[3], 10);
      if (y < 100) y += 2000;
      return `${d} ${BULAN[mth]} ${y}`;
    }
    return s;
  }

  function isLotIndexToken(v) {
    if (!v) return false;
    const s = String(v).trim();
    return /^\(?\s*\d+\s*\)?$/.test(s) || /^-\s*\d+$/.test(s);
  }

  function isHeaderNameToken(name) {
    if (!name) return false;
    const s = String(name).trim();
    if (!s) return false;
    if (isDateToken(s)) return false;
    if (['gl', 'gt', 'bs', 'g'].includes(s.toLowerCase())) return false;
    if (s.toLowerCase().startsWith('bs')) return false;
    if (isLotIndexToken(s)) return false;
    if (/^[0-9()\-.\s]+$/.test(s)) return false;
    const letters = s.match(/[a-zA-Z]/g);
    if (!letters || letters.length < 2) return false;
    return true;
  }

  function isBsRow(r) {
    if (!r) return false;
    if (r.bs === true) return true;
    const ket = String(r.ket || '').trim().toLowerCase();
    const no = String(r.no || '').trim().toLowerCase();
    const nama = String(r.nama || '').trim().toLowerCase();
    const gl = String(r.gl || '').trim().toLowerCase();

    if (ket === 'ada bs') return false;
    if (no === 'bs' || no.startsWith('bs')) return true;
    if (ket.includes('bs')) return true;
    if (nama.startsWith('bs') || (nama.includes('bs') && !nama.includes('bahruddin') && !nama.includes('basri') && !nama.includes('subaidi'))) return true;
    if (gl === 'bs') return true;
    return false;
  }

  function detectInfo(rows, defaultNo) {
    let nama = '';
    let tanggal = '';
    let alamat = '';

    if (!rows || rows.length === 0) {
      return { nama, tanggal, alamat };
    }

    const items = [];
    rows.forEach((r, idx) => {
      const v = r.nama !== undefined && r.nama !== null ? String(r.nama).trim() : '';
      if (v) {
        items.push({ no: r.no || (idx + 1), text: v, isDate: isDateToken(v) });
      }
    });

    const dateIdx = items.findIndex(item => item.isDate);
    if (dateIdx !== -1) {
      tanggal = formatIndoDate(items[dateIdx].text);
      for (let i = dateIdx - 1; i >= 0; i--) {
        if (!items[i].isDate) {
          nama = items[i].text;
          break;
        }
      }
      for (let i = dateIdx + 1; i < items.length; i++) {
        if (!items[i].isDate) {
          alamat = items[i].text;
          break;
        }
      }
    } else {
      const nonDates = items.filter(i => !i.isDate);
      if (nonDates.length > 0) nama = nonDates[0].text;
      if (nonDates.length > 1) alamat = nonDates[1].text;
    }

    return {
      nama: nama.replace(/[()]/g, '').trim(),
      tanggal: tanggal.replace(/[()]/g, '').trim(),
      alamat: alamat.replace(/[()]/g, '').trim()
    };
  }

  return {
    roundInt,
    calcBrt,
    calcHarga,
    calcNet,
    isDateToken,
    formatIndoDate,
    isLotIndexToken,
    isHeaderNameToken,
    isBsRow,
    detectInfo,
    BULAN
  };
}));
