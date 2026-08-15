---
name: vision-nota
description: Keahlian untuk memproses foto berkas fisik catatan tembakau dan file Excel Buku Sortir menjadi Buku Sortir 11-kolom dan Nota Pembelian resmi (xlsx 2 / Cetak A4) menggunakan Vision AI dan ExcelJS.
---

# Keahlian & Workflow Vision AI Nota Tembakau

Gunakan keahlian ini saat memproses data catatan sortir tembakau (baik dari foto fisik maupun file Excel Buku Sortir) menjadi spreadsheet interaktif atau Nota Pembelian resmi.

---

## 1. Menjalankan Server Lokal Vision AI
Aplikasi Vision AI didukung oleh server Python lokal sederhana:
```powershell
python c:\Users\USER\Downloads\nota-vision-ai\server.py
```
- Server berjalan pada port `8000` (akses di browser: `http://localhost:8000`).
- File UI utama: [index.html](file:///c:/Users/USER/Downloads/nota-vision-ai/index.html).

---

## 2. Alur Dual-Source Masukan Data

### A. Metode 1: Vision AI (Foto Berkas Fisik)
1. **Input Gambar**: Menerima foto kertas catatan sortir tulisan tangan atau jepret kamera langsung.
2. **Model Vision AI**: Menggunakan Google Gemini Flash Vision AI untuk membaca teks coretan, nomor bal, nama petani, grade, dan bobot timbangan.
3. **Validasi & Perhitungan**:
   - Terapkan aturan kalkulasi otomatis di `.agents/rules/sistem_nota_tembakau.md` untuk menghitung `BRT`, `NET`, dan `HARGA`.

### B. Metode 2: Upload File Excel Buku Sortir (`xlsx 1`)
1. **Input File Excel**: Upload file `.xlsx` seperti `Buku_Soter_1-1000 GREEND.xlsx` via drag-and-drop atau tombol upload.
2. **Parser Otomatis**: Memetakan 11 kolom standar (`GL`, `NO`, `GT`, `NAMA`, `GRADE`, `HARGA`, `KG`, `BRT`, `BRT FIX`, `NET`, `KET`) dan mengekstrak baris BS di luar tabel.
3. **Chip Petani Interaktif**: Mengidentifikasi otomatis blok nomor per petani (misal: `AMIR (1-9)`, `H.HANAN (10-15)`, `BAHRUDIN (142-147)`).

---

## 3. Ekspor & Pembuatan Nota Pembelian (`xlsx 2`)

### A. Generator Excel Resmi (ExcelJS)
- **Mesin**: Menggunakan `exceljs.min.js` lokal untuk mempertahankan garis kotak (*Medium & Thin Borders*), font *Bahnschrift*, format angka ribuan `#,##0`, dan logo daun tembakau di cell `A2`.
- **Lebar Kolom**: Kolom `JUMLAH` disetel minimal lebar `24` untuk mencegah overflow `#####`.
- **PageSetup**: A4 Portrait (`paperSize: 9`, `horizontalDpi: 300`, `verticalDpi: 300`) agar terbebas dari recovery warning.
- **Formula Wajib**:
  - `JUMLAH`: `=SUM(E9:En)`
  - `PPH 0,5%`: `=CEILING(E[jml]*0.005, 5000)`
  - `Koli`: `=COUNTA(A9:An)*5000`
  - `GT`: `=65000*COUNTIF(A9:An, "GT*")` (jika ada bal GT)
  - `TOTAL`: `=JUMLAH - PPH - Koli - GT`

### B. Cetak Langsung Kertas A4 (Print Modal)
- Tombol **`"Cetak / Print Nota (A4)"`** memunculkan lembar nota bergaris penuh dengan logo tembakau, identitas lengkap, dan tanda tangan kasir/petani.
- Preset cetak browser: `@page { size: A4 portrait; margin: 12mm 15mm; }`.

---

## 4. Skrip Generator Python Mandiri (CLI)
Jika ingin menghasilkan nota via baris perintah Python:
```powershell
python scripts/nota_generator.py "Buku_Soter_1-1000 GREEND.xlsx" 142-147
```
Hasil nota akan disimpan ke folder `nota/nota_142-147.xlsx`.
