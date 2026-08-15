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

## 3. Standar Format Nota Pembelian (5 Kolom)
Tabel nota yang dihasilkan untuk cetak/ekspor memiliki struktur:
1. `NO`: Nomor urut.
2. `BANYAKNYA`: Jumlah berat bersih (`NET`) dalam satuan Kg.
3. `NAMA BARANG`: Deskripsi tembakau (menampilkan nomor `GL`, `GT`, dan `GRADE`).
4. `HARGA`: Nilai `HARGA` per kg.
5. `JUMLAH`: Subtotal perkalian ($\text{NET} \times \text{HARGA}$).

### Bagian Header & Footer Nota:
- **Header**: Tanggal nota, Nama Petani/Penjual, Alamat.
- **Footer**:
  - Total Kg ($\sum \text{NET}$).
  - Total Tagihan / Jumlah Rupiah ($\sum \text{JUMLAH}$).
  - Kolom Tanda Tangan Penerima / Kasir.
