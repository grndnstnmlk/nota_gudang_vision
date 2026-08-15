/**
 * Vision AI — Generator Nota & Buku Sortir Tembakau
 * High-precision handwriting extraction powered by Google Gemini Vision & SheetJS
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- State Variables ---
  let currentImageSrc = null;
  let tobaccoData = [];
  let cameraStream = null;
  let isScanning = false;

  const API_KEY_STORAGE = 'vision_nota_gemini_api_key';
  const MODEL_STORAGE = 'vision_nota_gemini_model';

  // --- DOM Elements ---
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const btnCameraOpen = document.getElementById('btnCameraOpen');
  const btnLoadDemoSample = document.getElementById('btnLoadDemoSample');
  const btnResetPhoto = document.getElementById('btnResetPhoto');
  const previewActions = document.getElementById('previewActions');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const btnRunVisionAI = document.getElementById('btnRunVisionAI');
  const progressBox = document.getElementById('progressBox');
  const progressStatus = document.getElementById('progressStatus');
  const progressSub = document.getElementById('progressSub');
  const progressBarFill = document.getElementById('progressBarFill');

  // Table & Output Elements
  const gridTable = document.getElementById('gridTable');
  const tableBody = document.getElementById('tableBody');
  const btnAddRow = document.getElementById('btnAddRow');
  const btnRecalc = document.getElementById('btnRecalc');
  const inputNotaRange = document.getElementById('inputNotaRange');
  const inputNotaNama = document.getElementById('inputNotaNama');
  const inputNotaTanggal = document.getElementById('inputNotaTanggal');
  const inputNotaAlamat = document.getElementById('inputNotaAlamat');

  const statTotalRows = document.getElementById('statTotalRows');
  const statTotalKg = document.getElementById('statTotalKg');
  const statTotalBrt = document.getElementById('statTotalBrt');
  const statTotalNet = document.getElementById('statTotalNet');
  const statTotalRp = document.getElementById('statTotalRp');

  const btnExportBukuSortir = document.getElementById('btnExportBukuSortir');
  const btnGenerateNota = document.getElementById('btnGenerateNota');

  // API Key Modal Elements
  const btnOpenApiKeyModal = document.getElementById('btnOpenApiKeyModal');
  const apiKeyStatusLabel = document.getElementById('apiKeyStatusLabel');
  const apiKeyModal = document.getElementById('apiKeyModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const btnCloseApiKeyModal = document.getElementById('btnCloseApiKeyModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const btnToggleKeyVis = document.getElementById('btnToggleKeyVis');
  const modelSelect = document.getElementById('modelSelect');
  const btnSaveApiKey = document.getElementById('btnSaveApiKey');
  const btnClearApiKey = document.getElementById('btnClearApiKey');

  // Camera Modal Elements
  const cameraModal = document.getElementById('cameraModal');
  const cameraBackdrop = document.getElementById('cameraBackdrop');
  const btnCloseCamera = document.getElementById('btnCloseCamera');
  const btnCancelCamera = document.getElementById('btnCancelCamera');
  const btnSnapPhoto = document.getElementById('btnSnapPhoto');
  const cameraVideo = document.getElementById('cameraVideo');

  // Theme & Toast
  const themeToggle = document.getElementById('themeToggle');
  const toastContainer = document.getElementById('toastContainer');

  // =========================================================================
  // Theme Toggle
  // =========================================================================
  const savedTheme = localStorage.getItem('vision_nota_theme') || 'dark';
  document.body.className = savedTheme === 'light' ? 'light-theme' : 'dark-theme';

  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme', !isLight);
    localStorage.setItem('vision_nota_theme', isLight ? 'light' : 'dark');
  });

  // =========================================================================
  // Toast Notification
  // =========================================================================
  function showToast(message, type = 'info', duration = 3800) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    
    toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // =========================================================================
  // API Key Management
  // =========================================================================
  function getSavedApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  function getSavedModel() {
    return localStorage.getItem(MODEL_STORAGE) || 'gemini-1.5-flash';
  }

  function updateApiKeyIndicator() {
    const key = getSavedApiKey();
    if (key) {
      apiKeyStatusLabel.textContent = 'API Key Aktif (AI Ready)';
      btnOpenApiKeyModal.style.borderColor = 'var(--success)';
      btnOpenApiKeyModal.style.color = 'var(--success)';
      btnOpenApiKeyModal.style.background = 'rgba(16, 185, 129, 0.12)';
    } else {
      apiKeyStatusLabel.textContent = 'Atur API Key Vision';
      btnOpenApiKeyModal.style.borderColor = 'rgba(99, 102, 241, 0.35)';
      btnOpenApiKeyModal.style.color = 'var(--accent-primary)';
      btnOpenApiKeyModal.style.background = 'rgba(99, 102, 241, 0.12)';
    }
  }

  btnOpenApiKeyModal.addEventListener('click', () => {
    apiKeyInput.value = getSavedApiKey();
    modelSelect.value = getSavedModel();
    apiKeyModal.classList.add('active');
  });

  function closeApiKeyModal() {
    apiKeyModal.classList.remove('active');
  }

  btnCloseApiKeyModal.addEventListener('click', closeApiKeyModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeApiKeyModal);

  btnToggleKeyVis.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  btnSaveApiKey.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showToast('Masukkan Google Gemini API Key Anda', 'error');
      return;
    }
    localStorage.setItem(API_KEY_STORAGE, key);
    localStorage.setItem(MODEL_STORAGE, modelSelect.value);
    updateApiKeyIndicator();
    closeApiKeyModal();
    showToast('API Key Vision AI berhasil disimpan!', 'success');
  });

  btnClearApiKey.addEventListener('click', () => {
    localStorage.removeItem(API_KEY_STORAGE);
    apiKeyInput.value = '';
    updateApiKeyIndicator();
    showToast('API Key telah dihapus', 'info');
  });

  updateApiKeyIndicator();

  // =========================================================================
  // Image Upload & Source Handling
  // =========================================================================
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadImageFile(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadImageFile(e.dataTransfer.files[0]);
    }
  });

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageSrc = e.target.result;
      previewImage.src = currentImageSrc;
      dropzone.style.display = 'none';
      previewContainer.style.display = 'flex';
      previewActions.style.display = 'flex';
      showToast('Foto berkas berhasil dimuat!', 'success');
    };
    reader.readAsDataURL(file);
  }

  btnResetPhoto.addEventListener('click', () => {
    currentImageSrc = null;
    fileInput.value = '';
    previewImage.src = '';
    dropzone.style.display = 'block';
    previewContainer.style.display = 'none';
    previewActions.style.display = 'none';
    progressBox.style.display = 'none';
  });

  // =========================================================================
  // Camera Capture
  // =========================================================================
  btnCameraOpen.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      cameraVideo.srcObject = cameraStream;
      cameraModal.classList.add('active');
    } catch (err) {
      console.error('Camera error:', err);
      showToast('Gagal mengakses kamera. Izinkan izin kamera di browser.', 'error');
    }
  });

  function closeCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    cameraModal.classList.remove('active');
  }

  btnCloseCamera.addEventListener('click', closeCamera);
  btnCancelCamera.addEventListener('click', closeCamera);
  if (cameraBackdrop) cameraBackdrop.addEventListener('click', closeCamera);

  btnSnapPhoto.addEventListener('click', () => {
    if (!cameraVideo.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0);
    closeCamera();

    currentImageSrc = canvas.toDataURL('image/jpeg', 0.95);
    previewImage.src = currentImageSrc;
    dropzone.style.display = 'none';
    previewContainer.style.display = 'flex';
    previewActions.style.display = 'flex';
    showToast('Foto berhasil dijepret!', 'success');
  });

  // =========================================================================
  // Tobacco Business Calculation Rules
  // =========================================================================
  function calc_brt(kg, brt_fix) {
    if (brt_fix !== null && brt_fix !== undefined && String(brt_fix).trim() !== '') {
      const num = Number(brt_fix);
      if (!isNaN(num)) return Math.round(num);
    }
    if (kg === null || kg === undefined || String(kg).trim() === '') return '';
    const kf = parseFloat(kg);
    if (isNaN(kf)) return kg;
    const dec = Math.round((kf % 1) * 10) / 10;
    if (dec > 0 && dec <= 0.4) {
      return Math.floor(kf) - 1;
    }
    return Math.floor(kf);
  }

  function calc_harga(grade, harga) {
    if (harga !== null && harga !== undefined && String(harga).trim() !== '') {
      const num = Number(harga);
      if (!isNaN(num)) return num;
    }
    if (grade === null || grade === undefined || String(grade).trim() === '') return '';
    const g = parseFloat(grade);
    if (isNaN(g)) return 0;
    return Math.round(g * 1000);
  }

  function calc_net(brt, gl) {
    if (brt === null || brt === undefined || String(brt).trim() === '') return '';
    const b = parseFloat(brt);
    if (isNaN(b)) return 0;
    if (String(gl || '').trim().toLowerCase() === 'gl') {
      return b - 2;
    }
    if (b >= 60) return b - 5;
    if (b >= 50 && b < 60) return b - 4;
    if (b >= 10 && b < 50) return b - 3;
    return b;
  }

  // =========================================================================
  // Table Rendering & Inline Spreadsheet Logic
  // =========================================================================
  function renderGridTable() {
    if (!tableBody) return;
    if (tobaccoData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="12" class="empty-state-cell">
            <i data-lucide="table"></i>
            <p>Belum ada data. Silakan upload foto berkas atau klik <strong>"Muat Sampel Berkas"</strong>.</p>
          </td>
        </tr>
      `;
      updateStats();
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    tobaccoData.forEach((row, idx) => {
      html += `
        <tr data-idx="${idx}">
          <td><input type="number" class="grid-input" data-field="no" value="${row.no ?? (idx + 1)}" /></td>
          <td><input type="text" class="grid-input" data-field="gl" value="${escapeHtml(row.gl || '')}" placeholder="gl" /></td>
          <td><input type="text" class="grid-input" data-field="gt" value="${escapeHtml(row.gt || '')}" placeholder="GT" /></td>
          <td><input type="text" class="grid-input align-left" data-field="nama" value="${escapeHtml(row.nama || '')}" placeholder="Nama / Tgl / Alamat" /></td>
          <td><input type="text" class="grid-input" data-field="grade" value="${escapeHtml(row.grade || '')}" placeholder="58" /></td>
          <td><span class="calc-val">${row.harga ? Number(row.harga).toLocaleString('id-ID') : '-'}</span></td>
          <td><input type="text" class="grid-input" data-field="kg" value="${escapeHtml(row.kg || '')}" placeholder="41.0" /></td>
          <td><span class="calc-val">${row.brt !== '' && row.brt !== null ? row.brt : '-'}</span></td>
          <td><input type="text" class="grid-input grid-input-fix" data-field="brt_fix" value="${escapeHtml(row.brt_fix || '')}" placeholder="Fix" title="Isi manual jika bobot dari bos berbeda" /></td>
          <td><span class="calc-val net-val">${row.net !== '' && row.net !== null ? row.net : '-'}</span></td>
          <td><input type="text" class="grid-input align-left" data-field="ket" value="${escapeHtml(row.ket || '')}" placeholder="Ket" /></td>
          <td>
            <button type="button" class="btn-del-row" data-action="delete" data-idx="${idx}" title="Hapus baris">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    // Inline input events
    tableBody.querySelectorAll('input.grid-input').forEach(input => {
      input.addEventListener('input', () => {
        const tr = input.closest('tr');
        const idx = parseInt(tr.getAttribute('data-idx'), 10);
        const field = input.getAttribute('data-field');
        if (tobaccoData[idx]) {
          tobaccoData[idx][field] = input.value;
          const r = tobaccoData[idx];
          r.brt = calc_brt(r.kg, r.brt_fix);
          r.net = calc_net(r.brt, r.gl);
          r.harga = calc_harga(r.grade);

          const tds = tr.querySelectorAll('td');
          if (tds[5]) tds[5].querySelector('.calc-val').textContent = r.harga ? Number(r.harga).toLocaleString('id-ID') : '-';
          if (tds[7]) tds[7].querySelector('.calc-val').textContent = r.brt !== '' && r.brt !== null ? r.brt : '-';
          if (tds[9]) tds[9].querySelector('.calc-val').textContent = r.net !== '' && r.net !== null ? r.net : '-';

          updateStats();
        }
      });
    });

    // Delete row buttons
    tableBody.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        tobaccoData.splice(idx, 1);
        renderGridTable();
      });
    });

    updateStats();
  }

  function updateStats() {
    let totalKg = 0;
    let totalBrt = 0;
    let totalNet = 0;
    let totalRp = 0;

    tobaccoData.forEach(r => {
      const k = parseFloat(r.kg);
      if (!isNaN(k)) totalKg += k;
      const b = parseFloat(r.brt);
      if (!isNaN(b)) totalBrt += b;
      const n = parseFloat(r.net);
      if (!isNaN(n)) totalNet += n;
      const h = parseFloat(r.harga);
      if (!isNaN(n) && !isNaN(h)) totalRp += (n * h);
    });

    if (statTotalRows) statTotalRows.textContent = tobaccoData.length;
    if (statTotalKg) statTotalKg.textContent = totalKg.toFixed(1);
    if (statTotalBrt) statTotalBrt.textContent = Math.round(totalBrt);
    if (statTotalNet) statTotalNet.textContent = Math.round(totalNet);
    if (statTotalRp) statTotalRp.textContent = `Rp ${Math.round(totalRp).toLocaleString('id-ID')}`;
  }

  btnAddRow.addEventListener('click', () => {
    const nextNo = tobaccoData.length > 0 ? (parseInt(tobaccoData[tobaccoData.length - 1].no, 10) || tobaccoData.length) + 1 : 1;
    tobaccoData.push({
      no: nextNo,
      gl: '',
      gt: '',
      nama: '',
      grade: '58',
      harga: 58000,
      kg: '40.0',
      brt: 40,
      brt_fix: '',
      net: 37,
      ket: ''
    });
    renderGridTable();
  });

  btnRecalc.addEventListener('click', () => {
    tobaccoData.forEach(r => {
      r.brt = calc_brt(r.kg, r.brt_fix);
      r.net = calc_net(r.brt, r.gl);
      r.harga = calc_harga(r.grade);
    });
    renderGridTable();
    showToast('Rumus BRT, NET & HARGA berhasil dihitung ulang!', 'success');
  });

  // =========================================================================
  // Vision AI Execution (Gemini Vision API)
  // =========================================================================
  btnRunVisionAI.addEventListener('click', async () => {
    if (!currentImageSrc) {
      showToast('Pilih atau foto berkas kertas terlebih dahulu', 'error');
      return;
    }

    const apiKey = getSavedApiKey();
    if (!apiKey) {
      btnOpenApiKeyModal.click();
      showToast('Masukkan Google Gemini API Key Anda (100% Gratis)', 'info', 5000);
      return;
    }

    if (isScanning) return;
    isScanning = true;
    btnRunVisionAI.disabled = true;
    progressBox.style.display = 'flex';
    progressBarFill.style.width = '20%';
    progressStatus.textContent = 'Menghubungi Google Gemini Vision AI...';
    progressSub.textContent = 'Mempersiapkan gambar berkas sortir tembakau';

    try {
      const base64Data = currentImageSrc.split(',')[1];
      const model = getSavedModel();

      progressBarFill.style.width = '50%';
      progressStatus.textContent = 'Vision AI membaca tulisan tangan & angka...';
      progressSub.textContent = 'Mengekstrak kolom NO, GL, GT, NAMA, GRADE, KG, dan BRT';

      const prompt = `Anda adalah sistem OCR cerdas khusus membaca Buku Sortir Tembakau (catatan tulisan tangan dan formulir gudang).
Tugas Anda: Ekstrak seluruh baris data pada foto tabel berkas ini ke dalam format JSON Array murni.

Struktur kolom yang diharapkan per baris:
- "no": nomor urut barang/bal (angka 1, 2, 3, dst.)
- "gl": isi "gl" jika ada tanda 'gl' atau kolom GL terisi, jika tidak kosongkan ""
- "gt": isi "GT" jika ada tanda 'GT' atau kolom GT terisi, jika tidak kosongkan ""
- "nama": nama penjual/keterangan baris (contoh: "H. GHALIB", "(15/8/26)", "KADUR", dll)
- "grade": angka mutu tembakau (contoh: 58, 55, 45, 65, dll)
- "kg": berat timbangan dengan desimal jika ada (contoh: 41.0, 38.6, 47.6, 42.8)
- "brt_fix": isi angka jika ada tulisan bobot fix manual khusus dari bos/mandor, jika tidak kosongkan ""
- "ket": keterangan tambahan seperti "ada bs" atau lainnya jika ada

PENTING:
1. Pastikan angka desimal KG terbaca teliti (.0, .1, .2, .3, .4, .5, .6, .7, .8, .9).
2. Kembalikan HANYA format JSON valid tanpa kata pengantar, seperti:
[
  {"no": 1, "gl": "", "gt": "", "nama": "H. GHALIB", "grade": "58", "kg": "41.0", "brt_fix": "", "ket": ""},
  {"no": 2, "gl": "", "gt": "", "nama": "(15/8/26)", "grade": "58", "kg": "40.0", "brt_fix": "", "ket": ""}
]`;

      const requestBody = JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
          ]
        }],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 4096
        }
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${response.status}`);
      }

      progressBarFill.style.width = '85%';
      progressStatus.textContent = 'Memproses kalkulasi otomatis...';

      const data = await response.json();
      let textOut = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      textOut = textOut.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();

      let parsedRows = [];
      try {
        parsedRows = JSON.parse(textOut);
      } catch (parseErr) {
        // Fallback simple line parsing if not json
        console.warn('JSON parse fallback, trying line parsing:', textOut);
        const lines = textOut.split('\n').filter(l => l.trim().length > 0);
        lines.forEach((l, i) => {
          const toks = l.split(/[\t,|]+/).map(t => t.trim()).filter(t => t);
          if (toks.length >= 2) {
            parsedRows.push({
              no: i + 1,
              gl: '',
              gt: '',
              nama: toks[0] || '',
              grade: toks[1] || '58',
              kg: toks[2] || '40.0',
              brt_fix: '',
              ket: ''
            });
          }
        });
      }

      if (Array.isArray(parsedRows) && parsedRows.length > 0) {
        tobaccoData = parsedRows.map((r, i) => {
          const noVal = r.no ? Number(r.no) : (i + 1);
          const brtVal = calc_brt(r.kg, r.brt_fix);
          const netVal = calc_net(brtVal, r.gl);
          const hrgVal = calc_harga(r.grade);
          return {
            no: noVal,
            gl: r.gl || '',
            gt: r.gt || '',
            nama: r.nama || '',
            grade: r.grade ? String(r.grade) : '',
            harga: hrgVal,
            kg: r.kg ? String(r.kg) : '',
            brt: brtVal,
            brt_fix: r.brt_fix ? String(r.brt_fix) : '',
            net: netVal,
            ket: r.ket || ''
          };
        });

        renderGridTable();
        showToast(`Vision AI berhasil mengekstrak ${tobaccoData.length} baris data Buku Sortir!`, 'success', 5000);
      } else {
        throw new Error('Tidak ada baris data terstruktur yang terdeteksi pada foto.');
      }

    } catch (err) {
      console.error('Vision AI Error:', err);
      showToast(`Vision AI Gagal: ${err.message}`, 'error', 6000);
    } finally {
      isScanning = false;
      btnRunVisionAI.disabled = false;
      setTimeout(() => {
        progressBox.style.display = 'none';
      }, 1000);
    }
  });

  // =========================================================================
  // Demo Sample Loader
  // =========================================================================
  btnLoadDemoSample.addEventListener('click', () => {
    tobaccoData = [
      { no: 1, gl: '', gt: '', nama: 'H. GHALIB', grade: '58', harga: 58000, kg: '41.0', brt: 38, brt_fix: '38', net: 35, ket: '' },
      { no: 2, gl: '', gt: '', nama: '(15/8/26)', grade: '58', harga: 58000, kg: '40.0', brt: 37, brt_fix: '37', net: 34, ket: '' },
      { no: 3, gl: '', gt: '', nama: '', grade: '58', harga: 58000, kg: '39.0', brt: 36, brt_fix: '36', net: 33, ket: '' },
      { no: 4, gl: '', gt: 'GT', nama: '', grade: '58', harga: 58000, kg: '33.0', brt: 30, brt_fix: '30', net: 27, ket: '' },
      { no: 5, gl: '', gt: '', nama: '', grade: '58', harga: 58000, kg: '41.0', brt: 38, brt_fix: '38', net: 35, ket: '' },
      { no: 6, gl: '', gt: '', nama: '', grade: '58', harga: 58000, kg: '39.0', brt: 36, brt_fix: '36', net: 33, ket: '' },
      { no: 7, gl: '', gt: '', nama: '', grade: '58', harga: 58000, kg: '39.0', brt: 36, brt_fix: '36', net: 33, ket: '' },
      { no: 8, gl: '', gt: 'GT', nama: '', grade: '58', harga: 58000, kg: '36.0', brt: 33, brt_fix: '33', net: 30, ket: '' },
      { no: 9, gl: '', gt: '', nama: '', grade: '55', harga: 55000, kg: '42.0', brt: 39, brt_fix: '39', net: 36, ket: '' },
      { no: 10, gl: '', gt: 'GT', nama: '', grade: '56', harga: 56000, kg: '50.0', brt: 47, brt_fix: '47', net: 43, ket: '' },
      { no: 11, gl: '', gt: 'GT', nama: '', grade: '56', harga: 56000, kg: '39.0', brt: 36, brt_fix: '36', net: 33, ket: '' },
      { no: 12, gl: '', gt: '', nama: '', grade: '55', harga: 55000, kg: '38.0', brt: 35, brt_fix: '35', net: 32, ket: '' },
      { no: 36, gl: '', gt: '', nama: 'Zaini', grade: '45', harga: 45000, kg: '38.6', brt: 38, brt_fix: '', net: 35, ket: '' },
      { no: 37, gl: '', gt: '', nama: '(15/8/26)', grade: '45', harga: 45000, kg: '47.6', brt: 47, brt_fix: '', net: 44, ket: '' },
      { no: 38, gl: '', gt: '', nama: 'KADUR', grade: '46', harga: 46000, kg: '46.4', brt: 45, brt_fix: '', net: 42, ket: '' },
      { no: 39, gl: '', gt: '', nama: '', grade: '46', harga: 46000, kg: '38.2', brt: 37, brt_fix: '', net: 34, ket: '' }
    ];

    renderGridTable();
    showToast('Sampel Buku Sortir berhasil dimuat!', 'success');
  });

  // =========================================================================
  // 1-Click Excel Exporters (SheetJS)
  // =========================================================================
  btnExportBukuSortir.addEventListener('click', () => {
    if (tobaccoData.length === 0) {
      showToast('Tidak ada data Buku Sortir untuk diekspor', 'error');
      return;
    }

    const wsData = [
      ['BUKU SORTIR 2026 GREEND B'],
      [],
      ['GL', 'NO', 'GT', 'NAMA', 'GRADE', 'HARGA', 'KG', 'BRT', 'BRT FIX', 'NET', 'KET']
    ];

    tobaccoData.forEach(r => {
      wsData.push([
        r.gl || null,
        Number(r.no) || r.no,
        r.gt || null,
        r.nama || null,
        r.grade ? Number(r.grade) : null,
        r.harga ? Number(r.harga) : null,
        r.kg ? Number(r.kg) : null,
        r.brt !== '' && r.brt !== null ? Number(r.brt) : null,
        r.brt_fix ? Number(r.brt_fix) : null,
        r.net !== '' && r.net !== null ? Number(r.net) : null,
        r.ket || null
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 22 },
      { wch: 9 }, { wch: 12 }, { wch: 10 }, { wch: 9 },
      { wch: 11 }, { wch: 9 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Buku Soter');
    const filename = `Buku_Sortir_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Buku Sortir berhasil diunduh -> ${filename}`, 'success');
  });

  btnGenerateNota.addEventListener('click', () => {
    if (tobaccoData.length === 0) {
      showToast('Tidak ada data untuk membuat Nota Pembelian', 'error');
      return;
    }

    const rangeVal = (inputNotaRange ? inputNotaRange.value : 'SEMUA').trim();
    let filteredRows = [...tobaccoData];
    let startNo = null;
    let endNo = null;

    if (rangeVal && rangeVal.toUpperCase() !== 'SEMUA') {
      const match = rangeVal.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (match) {
        startNo = parseInt(match[1], 10);
        endNo = parseInt(match[2], 10);
        filteredRows = tobaccoData.filter(r => {
          const n = parseInt(r.no, 10);
          return !isNaN(n) && n >= startNo && n <= endNo;
        });
      }
    }

    if (filteredRows.length === 0) {
      showToast(`Tidak ada data di nomor rentang ${rangeVal}`, 'error');
      return;
    }

    // Auto discover headers
    let autoNama = '';
    let autoTanggal = '';
    let autoAlamat = '';

    for (let i = 0; i < filteredRows.length; i++) {
      const val = String(filteredRows[i].nama || '').trim();
      if (!val) continue;
      if (!autoNama) {
        autoNama = val;
      } else if (!autoTanggal && (val.includes('/') || val.includes('-') || /\d{1,2}\s+[A-Za-z]+/.test(val))) {
        autoTanggal = val.replace(/[()]/g, '').trim();
      } else if (!autoAlamat) {
        autoAlamat = val;
      }
    }

    const finalNama = (inputNotaNama && inputNotaNama.value.trim()) || autoNama || 'Nama Penjual';
    const finalTanggal = (inputNotaTanggal && inputNotaTanggal.value.trim()) || autoTanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const finalAlamat = (inputNotaAlamat && inputNotaAlamat.value.trim()) || autoAlamat || '';

    const wsData = [
      [],
      ['', 'NOTA PEMBELIAN TEMBAKAU 2026'],
      [],
      ['Nama    :', finalNama],
      ['Alamat  :', finalAlamat, '', finalTanggal],
      [],
      ['No. GUD', 'BRUTO', 'NETTO', 'HARGA', 'JUMLAH']
    ];

    let sumBruto = 0;
    let sumNetto = 0;
    let sumJumlah = 0;

    filteredRows.forEach(r => {
      let noGud = r.no;
      if (String(r.ket || '').toLowerCase().includes('bs')) {
        noGud = 'BS';
      } else if (String(r.gt || '').toUpperCase().trim() === 'GT') {
        noGud = `GT ${r.no}`;
      } else if (String(r.gl || '').toLowerCase().trim() === 'gl') {
        noGud = `GL ${r.no}`;
      }

      const brt = Number(r.brt) || 0;
      const net = Number(r.net) || 0;
      const hrg = Number(r.harga) || 0;
      const jml = net * hrg;

      sumBruto += brt;
      sumNetto += net;
      sumJumlah += jml;

      wsData.push([
        noGud,
        brt,
        net,
        hrg,
        jml
      ]);
    });

    wsData.push(['JUMLAH', sumBruto, sumNetto, '', sumJumlah]);
    wsData.push([]);
    wsData.push(['Yang Menerima', '', '', 'Penerima']);
    wsData.push([]);
    wsData.push([]);
    wsData.push(['(....................)', '', '', '(....................)']);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 }
    ];

    const rangeTag = startNo && endNo ? `${startNo}-${endNo}` : 'Lengkap';
    XLSX.utils.book_append_sheet(wb, ws, `Nota ${rangeTag}`);

    const filename = `Nota_${rangeTag}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Nota Pembelian berhasil dibuat -> ${filename} (${filteredRows.length} bal)`, 'success', 5000);
  });

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

});
