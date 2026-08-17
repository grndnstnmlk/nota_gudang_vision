/**
 * Vision AI Service Module
 * Handles Gemini Vision API integration, schema formatting, prompt building, and robust error handling.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VisionAIService = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SYSTEM_INSTRUCTION = `Anda adalah sistem OCR cerdas berstandar tinggi yang mengkhususkan diri dalam membaca catatan fisik kertas sortir tembakau (Buku Sortir & Catatan Petani Tembakau Madura).

Ekstrak tabel catatan tembakau dari foto secara presisi baris demi baris menjadi JSON array dengan properti berikut:
- no: nomor urut (integer atau string seperti '1', '2', 'BS')
- gl: 'gl' jika ada tulisan GL / goni luar di kolom kiri/penanda, kosongkan jika tidak ada
- gt: 'GT' jika ada stempel/tulisan GT, kosongkan jika tidak ada
- nama: nama petani/pemilik bal, tanggal, atau nomor lot (misal 'H. HANAN', '10/8/26', '(1)')
- grade: kode mutu/grade tembakau (misal '40', '63', '55')
- harga: harga per kg (misal 39000, 62000), jika tidak tertera hitung dari grade * 1000
- kg: berat kilogram mentah timbangan (misal '38.3', '45.6')
- brt_fix: angka BRT tulisan tangan checker jika ada (misal '37', '45'), atau kosongkan jika tidak ada
- ket: keterangan tambahan (misal '- 2', 'BS - 20', 'ada bs', dll.)

PENTING:
1. Pastikan nomor urut dan baris berurutan sesuai urutan visual kertas dari atas ke bawah.
2. Jika ada baris BS (Barang Sortir), masukkan barisnya dengan grade dan keterangan yang sesuai.
3. Kembalikan HANYA JSON array valid tanpa teks pengantar atau markdown tambahan.`;

  async function analyzeTobaccoImage(base64Data, mimeType, apiKey, modelName = 'gemini-2.5-flash', onProgress = () => {}) {
    if (!apiKey) {
      throw new Error('API Key Google Gemini belum diatur. Silakan atur API Key terlebih dahulu.');
    }

    onProgress('Mengirim foto berkas ke Google Gemini Vision...', 20);

    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const actualMime = mimeType || 'image/jpeg';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Baca dan ekstrak seluruh baris data sortir tembakau dari foto berkas ini secara lengkap dan akurat dalam format JSON array.' },
            {
              inline_data: {
                mime_type: actualMime,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    };

    onProgress('Memproses OCR & pengenalan tulisan tangan AI...', 50);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error ? errJson.error.message : `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(`Gagal memproses Vision AI: ${errMsg}`);
    }

    onProgress('Memformat data hasil ekstraksi...', 80);

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Vision AI tidak mengembalikan hasil teks yang valid.');
    }

    let rawText = candidate.content.parts.map(p => p.text || '').join('').trim();
    
    // Strip possible markdown fences
    if (rawText.startsWith('```json')) rawText = rawText.slice(7);
    if (rawText.startsWith('```')) rawText = rawText.slice(3);
    if (rawText.endsWith('```')) rawText = rawText.slice(0, -3);
    rawText = rawText.trim();

    let parsedData = [];
    try {
      parsedData = JSON.parse(rawText);
    } catch (parseErr) {
      // Attempt extracting JSON array substring
      const startIdx = rawText.indexOf('[');
      const endIdx = rawText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        parsedData = JSON.parse(rawText.substring(startIdx, endIdx + 1));
      } else {
        throw new Error('Gagal mengurai respons JSON dari AI: ' + parseErr.message);
      }
    }

    if (!Array.isArray(parsedData)) {
      if (typeof parsedData === 'object' && parsedData.items && Array.isArray(parsedData.items)) {
        parsedData = parsedData.items;
      } else if (typeof parsedData === 'object' && parsedData.data && Array.isArray(parsedData.data)) {
        parsedData = parsedData.data;
      } else {
        parsedData = [parsedData];
      }
    }

    onProgress('Selesai', 100);
    return parsedData;
  }

  return {
    analyzeTobaccoImage,
    SYSTEM_INSTRUCTION
  };
}));
