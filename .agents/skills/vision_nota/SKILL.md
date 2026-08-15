---
name: vision-nota
description: Keahlian untuk memproses foto berkas fisik catatan tembakau menjadi Buku Sortir dan Nota Excel menggunakan Vision AI dan server lokal.
---

# Keahlian & Workflow Vision AI Nota Tembakau

Gunakan keahlian ini saat memproses foto/gambar berkas catatan sortir tembakau menjadi spreadsheet interaktif atau file Excel resmi.

## 1. Menjalankan Server Lokal Vision AI
Aplikasi Vision AI didukung oleh server Python lokal sederhana:
```powershell
python c:\Users\USER\Downloads\nota-vision-ai\server.py
```
- Server berjalan pada port `8000` (atau port default browser `http://localhost:8000`).
- File UI utama: [index.html](file:///c:/Users/USER/Downloads/nota-vision-ai/index.html).

---

## 2. Alur Ekstraksi Vision AI
1. **Input Gambar**: Menerima foto berkas fisik tulisan tangan pulpen (tabel sortir gudang).
2. **Model Vision**: Menggunakan Google Gemini 1.5/2.0 Flash Vision AI untuk membaca tulisan tangan, kolom coretan, dan stempel timbangan.
3. **Struktur JSON yang Diekstrak**:
   ```json
   {
     "header": {
       "nama": "Pak Slamet",
       "tanggal": "15-08-2026",
       "alamat": "Temanggung"
     },
     "items": [
       {
         "no": 1,
         "gl": "gl 1",
         "gt": "",
         "grade": 55000,
         "harga": 54000,
         "kg": 65.4,
         "brt_fix": null,
         "ket": ""
       }
     ]
   }
   ```
4. **Validasi & Perhitungan**:
   - Selalu terapkan aturan kalkulasi `sistem_nota_tembakau.md` untuk menghitung otomatis `BRT` dan `NET`.
   - Periksa konsistensi total baris terhadap total rekapitulasi pada kertas (jika tertera).

---

## 3. Ekspor Excel & Nota
- **Buku Sortir (.xlsx)**: Grid 11 kolom lengkap untuk pembukuan gudang internal.
- **Nota Pembelian (.xlsx)**: File 5 kolom siap cetak ke kasir/petani, dilengkapi formula perkalian dan subtotal otomatis.
