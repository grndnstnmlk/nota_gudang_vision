/**
 * Excel Export Engine (ExcelJS + SheetJS Fallback)
 * Generates Buku Sortir (11-kolom) and Nota Pembelian (.xlsx) with full formatting, logo, and formulas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ExcelExportService = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  async function exportBukuSortir11Col(tobaccoData, filename = 'Buku_Sortir_Tembakau.xlsx') {
    const wsData = [
      ['BUKU SORTIR TEMBAKAU 2026'],
      [],
      ['GL', 'NO', 'GT', 'NAMA', 'GRADE', 'HARGA', 'KG', 'BRT', 'BRT FIX', 'NET', 'KET']
    ];

    tobaccoData.forEach((r, idx) => {
      wsData.push([
        r.gl || '',
        r.no !== undefined && r.no !== null ? r.no : (idx + 1),
        r.gt || '',
        r.nama || '',
        r.grade || '',
        r.harga !== undefined && r.harga !== null ? Number(r.harga) || r.harga : '',
        r.kg !== undefined && r.kg !== null ? r.kg : '',
        r.brt !== undefined && r.brt !== null ? Number(r.brt) || r.brt : '',
        r.brt_fix !== undefined && r.brt_fix !== null ? r.brt_fix : '',
        r.net !== undefined && r.net !== null ? Number(r.net) || r.net : '',
        r.ket || ''
      ]);
    });

    if (window.ExcelJS) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Buku Soter');

      ws.views = [{ showGridLines: true }];

      // Title
      ws.mergeCells('A1:K1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'BUKU SORTIR TEMBAKAU 2026';
      titleCell.font = { name: 'Bahnschrift', size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Header in Row 3
      const headers = ['GL', 'NO', 'GT', 'NAMA', 'GRADE', 'HARGA', 'KG', 'BRT', 'BRT FIX', 'NET', 'KET'];
      const headerRow = ws.getRow(3);
      headerRow.height = 20;

      headers.forEach((h, i) => {
        const c = headerRow.getCell(i + 1);
        c.value = h;
        c.font = { name: 'Bahnschrift', size: 11, bold: true };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
        c.border = {
          top: { style: 'medium' }, bottom: { style: 'medium' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // Data Rows
      tobaccoData.forEach((r, idx) => {
        const rowNum = 4 + idx;
        const row = ws.getRow(rowNum);
        row.height = 18;

        const rowValues = [
          r.gl || '',
          r.no !== undefined && r.no !== null ? r.no : (idx + 1),
          r.gt || '',
          r.nama || '',
          r.grade || '',
          r.harga !== undefined && r.harga !== null ? Number(r.harga) || r.harga : '',
          r.kg !== undefined && r.kg !== null ? r.kg : '',
          r.brt !== undefined && r.brt !== null ? Number(r.brt) || r.brt : '',
          r.brt_fix !== undefined && r.brt_fix !== null ? r.brt_fix : '',
          r.net !== undefined && r.net !== null ? Number(r.net) || r.net : '',
          r.ket || ''
        ];

        rowValues.forEach((val, colIdx) => {
          const c = row.getCell(colIdx + 1);
          c.value = val;
          c.font = { name: 'Bahnschrift', size: 10 };
          c.alignment = {
            horizontal: colIdx === 3 || colIdx === 10 ? 'left' : 'center',
            vertical: 'middle'
          };
          if (colIdx === 5 && typeof val === 'number') {
            c.numFmt = '#,##0';
          }
          c.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      ws.columns = [
        { width: 6 },  // GL
        { width: 6 },  // NO
        { width: 6 },  // GT
        { width: 22 }, // NAMA
        { width: 8 },  // GRADE
        { width: 14 }, // HARGA
        { width: 9 },  // KG
        { width: 8 },  // BRT
        { width: 10 }, // BRT FIX
        { width: 8 },  // NET
        { width: 16 }  // KET
      ];

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
      return;
    }

    // Fallback SheetJS
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Buku Soter');
    XLSX.writeFile(wb, filename);
  }

  async function exportNotaPembelian({
    filteredRows,
    nama,
    alamat,
    tanggal,
    pphRate = 0.01,
    sheetTitle = 'NOTA PEMBELIAN',
    filename = 'Nota_Pembelian.xlsx'
  }) {
    if (!filteredRows || filteredRows.length === 0) {
      throw new Error('Tidak ada data nota untuk diekspor.');
    }

    const COL_WIDTHS = [13.3, 12.9, 13.1, 19.7, 18.4, 9.1];

    if (window.ExcelJS) {
      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(sheetTitle.substring(0, 31), {
          pageSetup: {
            paperSize: 9, // A4
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: {
              left: 1.06,
              right: 0.20,
              top: 0.20,
              bottom: 0.20,
              header: 0.1,
              footer: 0.1
            }
          },
          views: [{ showGridLines: false }]
        });

        // Column widths
        COL_WIDTHS.forEach((w, i) => {
          ws.getColumn(i + 1).width = w;
        });

        // Insert Logo
        if (window.TOBACCO_LOGO_BASE64) {
          try {
            const logoId = wb.addImage({
              base64: window.TOBACCO_LOGO_BASE64,
              extension: 'png'
            });
            ws.addImage(logoId, {
              tl: { col: 0.15, row: 1.05 },
              ext: { width: 48, height: 48 },
              editAs: 'oneCell'
            });
          } catch (e) {
            console.warn('[ExcelExport] Logo embed skipped:', e);
          }
        }

        // Title
        const titleCell = ws.getCell('B2');
        titleCell.value = 'NOTA PEMBELIAN TEMBAKAU 2026';
        titleCell.font = { name: 'Bahnschrift', size: 16, bold: true };
        titleCell.alignment = { vertical: 'middle' };

        // Identity
        const setIdentity = (row, label, val) => {
          const cLabel = ws.getCell(`A${row}`);
          cLabel.value = label;
          cLabel.font = { name: 'Bahnschrift', size: 11, bold: true };
          cLabel.alignment = { horizontal: 'right', vertical: 'middle' };

          const cVal = ws.getCell(`B${row}`);
          cVal.value = val || '';
          cVal.font = { name: 'Bahnschrift', size: 11 };
          cVal.alignment = { horizontal: 'left', vertical: 'middle' };
        };

        setIdentity(4, 'Nama    :', nama);
        setIdentity(5, 'Alamat    :', alamat);
        setIdentity(6, 'Tgl/Hr/Thn  :', tanggal);

        // Header Table at Row 8
        const headers = ['No. GUD', 'BRUTO', 'NETTO', 'HARGA', 'JUMLAH'];
        const borderMedium = {
          top: { style: 'medium' }, bottom: { style: 'medium' },
          left: { style: 'medium' }, right: { style: 'medium' }
        };
        const borderThin = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };

        headers.forEach((h, idx) => {
          const cell = ws.getRow(8).getCell(idx + 1);
          cell.value = h;
          cell.font = { name: 'Bahnschrift', size: 12, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = borderMedium;
        });

        // Data Rows starting at Row 9
        const dataStart = 9;
        let gtCount = 0;
        let sumJumlah = 0;

        filteredRows.forEach((r, idx) => {
          const curRow = dataStart + idx;
          const rowObj = ws.getRow(curRow);
          rowObj.height = 16;

          let noGud = '';
          if (r.bs) {
            noGud = 'BS';
          } else if (String(r.gt || '').toUpperCase().trim() === 'GT') {
            noGud = `GT ${r.no}`;
            gtCount++;
          } else if (String(r.gl || '').toLowerCase().trim() === 'gl') {
            noGud = `GL ${r.no}`;
          } else {
            noGud = String(r.no || (idx + 1));
          }

          const brt = Number(r.brt) || 0;
          const net = Number(r.net) || 0;
          const hrg = Number(r.harga) || 0;
          const jml = net * hrg;
          sumJumlah += jml;

          const c1 = rowObj.getCell(1);
          c1.value = noGud;
          c1.font = { name: 'Bahnschrift', size: 11 };
          c1.alignment = { horizontal: 'center', vertical: 'middle' };
          c1.border = borderThin;

          const c2 = rowObj.getCell(2);
          c2.value = brt;
          c2.font = { name: 'Bahnschrift', size: 12 };
          c2.alignment = { horizontal: 'center', vertical: 'middle' };
          c2.border = borderThin;

          const c3 = rowObj.getCell(3);
          c3.value = net;
          c3.font = { name: 'Bahnschrift', size: 12 };
          c3.alignment = { horizontal: 'center', vertical: 'middle' };
          c3.border = borderThin;

          const c4 = rowObj.getCell(4);
          c4.value = hrg;
          c4.font = { name: 'Bahnschrift', size: 12 };
          c4.alignment = { horizontal: 'center', vertical: 'middle' };
          c4.numFmt = '#,##0';
          c4.border = borderThin;

          const c5 = rowObj.getCell(5);
          c5.value = { formula: `C${curRow}*D${curRow}`, result: jml };
          c5.font = { name: 'Bahnschrift', size: 12 };
          c5.alignment = { horizontal: 'center', vertical: 'middle' };
          c5.numFmt = '#,##0';
          c5.border = borderThin;
        });

        const dataEnd = dataStart + filteredRows.length - 1;
        const rJml = dataEnd + 1;
        const rPph = rJml + 1;
        const rGt = gtCount > 0 ? rPph + 1 : null;
        const rKoli = gtCount > 0 ? rPph + 2 : rPph + 1;
        const rTot = gtCount > 0 ? rKoli + 1 : rKoli + 1;

        const pphVal = pphRate > 0 ? Math.ceil((sumJumlah * pphRate) / 5000) * 5000 : 0;
        const pphLabel = pphRate === 0.005 ? 'PPH 0.5%' : (pphRate === 0.01 ? 'PPH 1%' : 'PPH 0%');
        const pphFormula = pphRate > 0 ? `CEILING(E${rJml}*${pphRate},5000)` : `0`;

        const koliVal = filteredRows.length * 5000;
        const gtVal = gtCount * 65000;
        const totalBersih = sumJumlah - pphVal - koliVal - gtVal;

        const addFooterRow = (rowNum, label, formula, resultVal, numFmt, isBold = false) => {
          const rowObj = ws.getRow(rowNum);
          rowObj.height = 16;

          const cLabel = rowObj.getCell(4);
          cLabel.value = label;
          cLabel.font = { name: 'Bahnschrift', size: 12, bold: isBold };
          cLabel.alignment = { horizontal: 'right', vertical: 'middle' };
          cLabel.border = borderThin;

          const cVal = rowObj.getCell(5);
          cVal.value = { formula, result: resultVal };
          cVal.font = { name: 'Bahnschrift', size: 12, bold: isBold };
          cVal.alignment = { horizontal: 'center', vertical: 'middle' };
          cVal.numFmt = numFmt;
          cVal.border = borderThin;
        };

        addFooterRow(rJml, 'JUMLAH ', `SUM(E${dataStart}:E${dataEnd})`, sumJumlah, '#,##0');
        addFooterRow(rPph, pphLabel, pphFormula, pphVal, '#,##0');
        if (gtCount > 0) {
          addFooterRow(rGt, 'GT', `65000*COUNTIF(A${dataStart}:A${dataEnd},"GT*")`, gtVal, '"Rp"#,##0');
        }
        addFooterRow(rKoli, 'Koli', `COUNTA(A${dataStart}:A${dataEnd})*5000`, koliVal, '"Rp"#,##0');

        const totFormula = gtCount > 0
          ? `E${rJml}-E${rKoli}-E${rGt}-E${rPph}`
          : `E${rJml}-E${rKoli}-E${rPph}`;
        addFooterRow(rTot, 'TOTAL', totFormula, totalBersih, '"Rp"#,##0', true);

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
        return;
      } catch (err) {
        console.warn('[ExcelJS Error, fallback to SheetJS]:', err);
      }
    }

    // Fallback SheetJS
    const wsData = [
      ['', 'NOTA PEMBELIAN TEMBAKAU 2026'],
      [],
      ['Nama    :', nama || ''],
      ['Alamat  :', alamat || ''],
      ['Tgl/Hr/Thn :', tanggal || ''],
      [],
      ['No. GUD', 'BRUTO', 'NETTO', 'HARGA', 'JUMLAH']
    ];

    let sumJumlah = 0;
    let gtCount = 0;
    const dataStartRow = 8;

    filteredRows.forEach((r, idx) => {
      const curRow = dataStartRow + idx;
      let noGud = '';
      if (r.bs) {
        noGud = 'BS';
      } else if (String(r.gt || '').toUpperCase().trim() === 'GT') {
        noGud = `GT ${r.no}`;
        gtCount++;
      } else if (String(r.gl || '').toLowerCase().trim() === 'gl') {
        noGud = `GL ${r.no}`;
      } else {
        noGud = String(r.no || (idx + 1));
      }

      const brt = Number(r.brt) || 0;
      const net = Number(r.net) || 0;
      const hrg = Number(r.harga) || 0;
      const jml = net * hrg;
      sumJumlah += jml;

      wsData.push([
        noGud,
        brt,
        net,
        hrg,
        { t: 'n', f: `C${curRow}*D${curRow}`, v: jml }
      ]);
    });

    const dataEndRow = dataStartRow + filteredRows.length - 1;
    const jumlahRow = dataEndRow + 1;
    const pphRow = jumlahRow + 1;
    const gtRow = gtCount > 0 ? pphRow + 1 : null;
    const koliRow = gtCount > 0 ? pphRow + 2 : pphRow + 1;

    const pphVal = pphRate > 0 ? Math.ceil((sumJumlah * pphRate) / 5000) * 5000 : 0;
    const pphLabel = pphRate === 0.005 ? 'PPH 0.5%' : (pphRate === 0.01 ? 'PPH 1%' : 'PPH 0%');
    const pphFormula = pphRate > 0 ? `CEILING(E${jumlahRow}*${pphRate}, 5000)` : `0`;

    const koliVal = filteredRows.length * 5000;
    const gtVal = gtCount * 65000;
    const totalBersih = sumJumlah - pphVal - koliVal - gtVal;

    wsData.push(['', '', '', 'JUMLAH', { t: 'n', f: `SUM(E${dataStartRow}:E${dataEndRow})`, v: sumJumlah }]);
    wsData.push(['', '', '', pphLabel, { t: 'n', f: pphFormula, v: pphVal }]);
    if (gtCount > 0) {
      wsData.push(['', '', '', 'GT', { t: 'n', f: `65000*COUNTIF(A${dataStartRow}:A${dataEndRow}, "GT*")`, v: gtVal }]);
    }
    wsData.push(['', '', '', 'Koli', { t: 'n', f: `COUNTA(A${dataStartRow}:A${dataEndRow})*5000`, v: koliVal }]);

    const totalFormula = gtCount > 0
      ? `E${jumlahRow}-E${koliRow}-E${gtRow}-E${pphRow}`
      : `E${jumlahRow}-E${koliRow}-E${pphRow}`;

    wsData.push(['', '', '', 'TOTAL', { t: 'n', f: totalFormula, v: totalBersih }]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 14 }, { wch: 11 }, { wch: 11 }, { wch: 15 }, { wch: 18 }];
    ws['!pageSetup'] = { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    ws['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };

    XLSX.utils.book_append_sheet(wb, ws, 'Nota');
    XLSX.writeFile(wb, filename);
  }

  return {
    exportBukuSortir11Col,
    exportNotaPembelian
  };
}));
