# ATURAN & SISTEM NOTA GENERATOR TEMBAKAU

## 1. Struktur Kolom Buku Sortir (11 Kolom)
Kolom standar Buku Sortir berurutan dari kiri ke kanan:
1. `NO`: Nomor urut baris (1, 2, 3, ...).
2. `GL`: Nomor/kode Gulung (`gl 1`, `gl 2`, dst).
3. `GT`: Nomor/kode Gantungan.
4. `NAMA`: Nama pemilik/petani (pola vertikal: Nama -> Tanggal -> Alamat).
5. `GRADE`: Grade tembakau (angka bulat ribuan, misal `50000`, `60000`).
6. `HARGA`: Harga per kg. Rumus default: `GRADE - 1000` (dapat di-override manual).
7. `KG`: Berat kotor timbangan (desimal, misal `65.4`).
8. `BRT`: Berat pembulatan timbangan.
9. `BRT FIX`: Nilai override manual untuk berat bulat.
10. `NET`: Berat bersih setelah potongan wadah/keranjang.
11. `KET`: Keterangan tambahan (misal potongan khusus, catatan kondisi).

---

## 2. Aturan Perhitungan Bisnis (Kalkulasi Otomatis)

### A. Perhitungan Harga (`calc_harga`)
- $\text{HARGA} = \text{GRADE} - 1000$
- Jika user menginput nilai harga kustom secara eksplisit, gunakan nilai input user.

### B. Perhitungan Berat Bulat (`calc_brt`)
1. **Prioritas Utama**: Jika kolom `BRT FIX` diisi angka, maka $\text{BRT} = \text{BRT FIX}$.
2. **Aturan Pecahan Desimal**:
   - Jika bagian desimal $(\text{KG} - \lfloor\text{KG}\rfloor) \le 0.4$, maka $\text{BRT} = \lfloor\text{KG}\rfloor - 1$.
   - Jika bagian desimal $> 0.4$, maka $\text{BRT} = \lfloor\text{KG}\rfloor$.

### C. Perhitungan Berat Bersih (`calc_net`)
- **Jika kolom `GL` terisi** (merupakan item Gulung):
  $$\text{NET} = \text{BRT} - 2\text{ kg}$$
- **Jika kolom `GL` kosong / non-GL**:
  - $\text{BRT} \le 50 \implies \text{NET} = \text{BRT} - 3\text{ kg}$
  - $51 \le \text{BRT} \le 70 \implies \text{NET} = \text{BRT} - 4\text{ kg}$
  - $\text{BRT} > 70 \implies \text{NET} = \text{BRT} - 5\text{ kg}$

---

## 3. Standar Format & Formula Nota Pembelian (5 Kolom)

### A. Layout Header
- **Judul**: `NOTA PEMBELIAN TEMBAKAU 2026`
- **Identitas**:
  - `Nama     : [Nama Penjual]` (contoh: `H. MAHFUD`)
  - `Alamat   : [Alamat]` (contoh: `Pegantenan`)
  - `Tgl/Hr/Thn : [Tanggal]` (contoh: `15 Agustus 2026`)

### B. Struktur Tabel 5 Kolom:
1. `No. GUD`: Kode bal gudang (contoh: `GL 307`, `GL 308`, `GT 123`, `BS`).
2. `BRUTO`: Bobot bruto bulat (`BRT`).
3. `NETTO`: Bobot bersih setelah potongan wadah (`NET`).
4. `HARGA`: Nilai harga per kg (`HARGA`).
5. `JUMLAH`: Formula Excel `=NETTO * HARGA` (contoh: `=C8*D8`).

### C. Formula Footer Wajib:
1. **`JUMLAH`**: Subtotal seluruh baris item:
   $$= \text{SUM}(E8:En)$$
2. **`PPH 0,5%`**: Pajak penghasilan 0,5% dibulatkan ke atas per 5.000:
   $$= \text{CEILING}(\text{JUMLAH} \times 0.005, 5000)$$
3. **`Koli`**: Biaya per bal/koli (Rp 5.000 per bal):
   $$= \text{COUNTA}(A8:An) \times 5000$$
4. **`GT`** (Hanya jika ada item GT):
   $$= \text{COUNTIF}(A8:An, \text{"GT*"}) \times 65000$$
5. **`TOTAL`**: Total tagihan bersih akhir yang dibayarkan:
   $$= \text{JUMLAH} - \text{PPH 0,5\%} - \text{Koli} - \text{GT (jika ada)}$$

---

## 4. Aturan Khusus Tembakau BS (Barang Sortir)

### A. Identifikasi Berkas & Ekstraksi Grade
- Tulisan fisik di kertas: misal `(BAHRUDIN) BS - 20`, `BS 20`, `BS-25`.
- **Angka setelah kata BS adalah nilai GRADE-nya**:
  - `BS - 20` atau `BS 20` $\implies \text{GRADE} = 20$ (Harga = Rp 20.000).
  - `BS - 25` atau `BS-25` $\implies \text{GRADE} = 25$ (Harga = Rp 25.000).
- Kolom `KET`: Diisi `"BS"` atau `"BS - 20"`.

### B. Format Penulisan pada Kolom `No. GUD` di Nota
- Pada Nota Pembelian, penulisan kode `BS` ditaruh **setelah nomor urut**:
  - Format: `[NO] BS` (contoh: baris 151 $\implies$ `151 BS`, atau `BS` jika tidak memiliki nomor).

