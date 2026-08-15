# ATURAN & SISTEM NOTA GENERATOR TEMBAKAU

## 1. Arsitektur Dual-Source Input (Foto & Excel)
Sistem mendukung 2 metode masukan data:
1. **Vision AI (Foto Berkas Fisik)**: Scan dan ekstraksi tulisan tangan dari foto kertas sortir menggunakan Gemini Vision AI.
2. **Excel Buku Sortir (`xlsx 1`)**: Upload langsung file Excel Buku Sortir (seperti `Buku_Soter_1-1000 GREEND.xlsx`) dengan parser otomatis 11 kolom.

---

## 2. Struktur Kolom Buku Sortir (11 Kolom)
Kolom standar Buku Sortir berurutan dari kiri ke kanan:
1. `NO`: Nomor urut baris (1, 2, 3, ... atau `BS`).
2. `GL`: Nomor/kode Gulung (`gl` atau `gl 1`, `gl 2`, dst).
3. `GT`: Nomor/kode Gantungan (`GT`).
4. `NAMA`: Nama pemilik/petani (pola vertikal: Nama -> Tanggal -> Alamat).
5. `GRADE`: Grade tembakau (misal `65`, `58` -> harga Rp 65.000, Rp 58.000).
6. `HARGA`: Harga per kg (default `GRADE * 1000` jika kosong).
7. `KG`: Berat kotor timbangan (desimal, misal `45.4`).
8. `BRT`: Berat pembulatan timbangan.
9. `BRT FIX`: Nilai override manual untuk berat bulat dari checker fisik.
10. `NET`: Berat bersih setelah potongan wadah/keranjang.
11. `KET`: Keterangan tambahan (misal potongan `-2`, `-3`, `BS - 20`).

---

## 3. Aturan Perhitungan Bisnis (Kalkulasi Otomatis)

### A. Perhitungan Harga (`calc_harga`)
- $\text{HARGA} = \text{GRADE} \times 1000$ (atau sesuai nilai override).

### B. Perhitungan Berat Bulat (`calc_brt`)
1. **Prioritas Utama**: Jika kolom `BRT FIX` diisi angka, maka $\text{BRT} = \text{BRT FIX}$.
2. **Aturan Pecahan Desimal**:
   - Jika bagian desimal $(\text{KG} - \lfloor\text{KG}\rfloor) \le 0.4$, maka $\text{BRT} = \lfloor\text{KG}\rfloor - 1$.
   - Jika bagian desimal $> 0.4$, maka $\text{BRT} = \lfloor\text{KG}\rfloor$.

### C. Perhitungan Berat Bersih (`calc_net`)
- **Jika kolom `GL` terisi (`gl`)**:
  $$\text{NET} = \text{BRT} - 2\text{ kg}$$
- **Jika kolom `GL` kosong / non-GL**:
  - $\text{BRT} \ge 60 \implies \text{NET} = \text{BRT} - 5\text{ kg}$
  - $50 \le \text{BRT} \le 59 \implies \text{NET} = \text{BRT} - 4\text{ kg}$
  - $10 \le \text{BRT} \le 49 \implies \text{NET} = \text{BRT} - 3\text{ kg}$

---

## 4. Standar Format & Formula Nota Pembelian (5 Kolom)

### A. Layout Header
- **Logo**: Gambar logo daun tembakau diikat pada cell `A2:A2` (ukuran proporsional ~36px).
- **Judul**: `NOTA PEMBELIAN TEMBAKAU 2026` di cell `B2`.
- **Identitas**:
  - `Nama    : [Nama Penjual]` (contoh: `BAHRUDIN`)
  - `Alamat    : [Alamat]` (contoh: `Pegantenan`)
  - `Tgl/Hr/Thn  : [Tanggal]` (contoh: `15 Agustus 2026`)

### B. Struktur Tabel 5 Kolom:
1. `No. GUD`: Kode bal gudang (contoh: `GL 142`, `GT 10`, `148 BS`, atau nomor saja).
2. `BRUTO`: Bobot bruto bulat (`BRT`).
3. `NETTO`: Bobot bersih setelah potongan wadah (`NET`).
4. `HARGA`: Nilai harga per kg (`HARGA`, format `#,##0`).
5. `JUMLAH`: Formula Excel `=NETTO * HARGA` (contoh: `=C9*D9`, format `#,##0`).

### C. Lebar Kolom Standar (Mencegah `#####`):
- `A (No. GUD)`: 14
- `B (BRUTO)`: 12
- `C (NETTO)`: 12
- `D (HARGA)`: 16
- `E (JUMLAH)`: 24 (wajib lebar agar angka jutaan dan `Rp` tidak overflow)

### D. Formula Footer Wajib:
1. **`JUMLAH`**: Subtotal seluruh baris item:
   $$= \text{SUM}(E9:En)$$
2. **`PPH 0,5%`**: Pajak penghasilan 0,5% dibulatkan ke atas per 5.000:
   $$= \text{CEILING}(\text{JUMLAH} \times 0.005, 5000)$$
3. **`Koli`**: Biaya per bal/koli (Rp 5.000 per bal):
   $$= \text{COUNTA}(A9:An) \times 5000$$
4. **`GT`** (Hanya jika ada item GT):
   $$= \text{COUNTIF}(A9:An, \text{"GT*"}) \times 65000$$
5. **`TOTAL`**: Total tagihan bersih akhir yang dibayarkan:
   $$= \text{JUMLAH} - \text{PPH 0,5\%} - \text{Koli} - \text{GT (jika ada)}$$

---

## 5. Aturan Khusus Tembakau BS (Barang Sortir)

### A. Identifikasi & Ekstraksi Grade
- Tembakau BS di luar tabel diidentifikasi tanpa nomor urut fisik (`NO = "BS"` atau baris keterangan `BS`).
- **Angka setelah kata BS adalah nilai GRADE-nya**:
  - `BS - 20` atau `BS 20` $\implies \text{GRADE} = 20$ (Harga = Rp 20.000).
  - `BS - 25` atau `BS-25` $\implies \text{GRADE} = 25$ (Harga = Rp 25.000).
- Kolom `KET`: Diisi `"BS"` atau `"BS - 20"`.

### B. Penggabungan Otomatis ke Nama Terdekat di Atasnya
- Baris BS **hanya dimasukkan ke nama petani yang berada tepat di atasnya** (nama terdekat di atas posisi catatan BS tersebut).
- Pada kolom `No. GUD` di Nota Pembelian, **hanya ditulis teks `"BS"` murni tanpa nomor**:
  - Kolom `No. GUD` $\implies$ **`"BS"`** (bukan `148 BS` atau angka lain, melainkan cukup `BS`).

---

## 6. Standar Cetak & PageSetup A4
- Kertas: A4 Portrait (`paperSize = 9`, `orientation = 'portrait'`).
- Margin: Kiri/Kanan/Atas/Bawah = 1.0 inch, Header/Footer = 0.5 inch.
- Resolusi Printer: Wajib eksplisit `horizontalDpi = 300`, `verticalDpi = 300` untuk mencegah error XML OpenOffice/Excel.
- Borders: Medium border pada header tabel, Thin border pada data dan footer.
