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
    const saved = localStorage.getItem(MODEL_STORAGE);
    if (!saved || saved === 'gemini-1.5-flash') {
      return 'gemini-2.5-flash';
    }
    return saved;
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

  const btnTestApiKey = document.getElementById('btnTestApiKey');
  const testKeyStatus = document.getElementById('testKeyStatus');

  async function fetchAvailableModelsFromGoogle(key) {
    let discovered = [];
    for (const ver of ['v1beta', 'v1']) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${key}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.models)) {
            const valid = json.models
              .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace(/^models\//, ''));
            discovered.push(...valid);
          }
        }
      } catch (e) {
        console.warn(`Error probing ${ver}:`, e);
      }
    }

    discovered = [...new Set(discovered)];
    discovered.sort((a, b) => {
      const aFlash = a.includes('flash') ? -1 : 1;
      const bFlash = b.includes('flash') ? -1 : 1;
      return aFlash - bFlash;
    });

    return discovered;
  }

  if (btnTestApiKey) {
    btnTestApiKey.addEventListener('click', async () => {
      const key = apiKeyInput.value.trim();
      if (!key) {
        showToast('Masukkan API Key terlebih dahulu untuk ditest', 'error');
        return;
      }

      if (testKeyStatus) {
        testKeyStatus.textContent = 'Memeriksa ke Google AI...';
        testKeyStatus.style.color = 'var(--text-muted)';
      }
      btnTestApiKey.disabled = true;

      try {
        const models = await fetchAvailableModelsFromGoogle(key);
        if (models.length > 0) {
          if (testKeyStatus) {
            testKeyStatus.textContent = `✅ API Key Valid (${models.length} model aktif)`;
            testKeyStatus.style.color = 'var(--success)';
          }

          modelSelect.innerHTML = '';
          models.forEach((m, idx) => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m + (idx === 0 ? ' (Direkomendasikan)' : '');
            modelSelect.appendChild(opt);
          });

          showToast(`Berhasil menemukan ${models.length} model Google Gemini aktif!`, 'success');
        } else {
          if (testKeyStatus) {
            testKeyStatus.textContent = '❌ Tidak ada model generateContent';
            testKeyStatus.style.color = 'var(--danger)';
          }
          showToast('API Key tidak memiliki akses ke model Gemini generateContent', 'error');
        }
      } catch (err) {
        if (testKeyStatus) {
          testKeyStatus.textContent = `❌ ${err.message}`;
          testKeyStatus.style.color = 'var(--danger)';
        }
        showToast(`Gagal: ${err.message}`, 'error');
      } finally {
        btnTestApiKey.disabled = false;
      }
    });
  }

  btnClearApiKey.addEventListener('click', () => {
    localStorage.removeItem(API_KEY_STORAGE);
    apiKeyInput.value = '';
    if (testKeyStatus) testKeyStatus.textContent = '';
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
          <td><input type="text" inputmode="numeric" class="grid-input grid-input-no" data-field="no" value="${escapeHtml(String(row.no ?? (idx + 1)))}" /></td>
          <td><input type="text" class="grid-input" data-field="gl" value="${escapeHtml(row.gl || '')}" placeholder="" /></td>
          <td><input type="text" class="grid-input" data-field="gt" value="${escapeHtml(row.gt || '')}" placeholder="" /></td>
          <td><input type="text" class="grid-input align-left" data-field="nama" value="${escapeHtml(row.nama || '')}" placeholder="" /></td>
          <td><input type="text" class="grid-input" data-field="grade" value="${escapeHtml(row.grade || '')}" placeholder="" /></td>
          <td><span class="calc-val">${row.harga ? Number(row.harga).toLocaleString('id-ID') : '-'}</span></td>
          <td><input type="text" class="grid-input" data-field="kg" value="${escapeHtml(row.kg || '')}" placeholder="" /></td>
          <td><span class="calc-val">${row.brt !== '' && row.brt !== null ? row.brt : '-'}</span></td>
          <td><input type="text" class="grid-input grid-input-fix" data-field="brt_fix" value="${escapeHtml(row.brt_fix || '')}" placeholder="" title="Isi manual jika bobot dari bos berbeda" /></td>
          <td><span class="calc-val net-val">${row.net !== '' && row.net !== null ? row.net : '-'}</span></td>
          <td><input type="text" class="grid-input align-left" data-field="ket" value="${escapeHtml(row.ket || '')}" placeholder="" /></td>
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

    renderNotaPresets();
    updateNotaLiveSummary(false);
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

      const prompt = `Anda adalah sistem Vision AI OCR cerdas khusus membaca Buku Sortir Tembakau (catatan tulisan tangan pulpen & formulir gudang tembakau).
Tugas Anda: Ekstrak seluruh baris data pada foto kertas berkas ini ke dalam format JSON Array murni.

ATURAN STRUKTUR KOLOM & POLA TULISAN TANGAN:
1. "no": Nomor urut baris (misal: 185, 186, 187, 200, 201... atau 125, 126...).
2. "nama": 
   - Berisi nama petani/penjual (misal: "KURDI", "H. HANAN", "ZAKIR", "AMIR", "H. MAHFUD", "Bahrudin"), tanggal (misal: "11/8/26", "(11/8 26)", "10/8/26"), atau alamat (misal: "KADUR").
   - Jika baris tersebut hanya berupa coretan kode "G" / "GL" / "GT", kosongkan "nama": "".
3. "gl": 
   - Isi "gl" jika ada tulisan "G", "GL", atau "gl" (baik di margin kiri luar tabel, di kolom nama, atau di kolom khusus). Jika tidak, isi "".
4. "gt": 
   - Isi "GT" jika ada tulisan "GT" atau "gt". Jika tidak, isi "".
5. "grade": Angka grade tembakau (misal: 48, 45, 46, 37, 32, 65, 57, 55, 61, 50, 43, dll).
6. "kg": 
   - Berat timbangan kotor WAJIB DITULIS LENGKAP DENGAN PECAHAN DESIMALNYA!
   - Contoh: "45.5", "44.2", "42.2", "45.9", "38.1", "48.8", "44.5", "35.6", "35.5", "38.8", "37.2", "46.6", "47.8", "38.5", "29.4", "36.9", "34.0", "45.8", "46.7", "37.2", "38.1", "38.6".
   - JANGAN dibulatkan dan JANGAN dihilangkan angka di belakang komanya!
7. "brt_fix": 
   - Kolom persis SETELAH kolom KG (pada tabel tercetak sebagai kolom BRT atau KET).
   - ATURAN MUTLAK:
     * JIKA kolom BRT pada kertas TERISI angka tulisan tangan (misal: 45, 43, 41, 37, 35, 34, 32...), maka masukkan angka tersebut ke "brt_fix".
     * JIKA kolom BRT pada kertas KOSONG / tidak ditulis (seperti pada beberapa baris), maka KOSONGKAN "brt_fix": "" (sistem akan menghitung otomatis).
8. "ket": Catatan khusus jika ada (misal "BS", "BS - 20", "ada bs", "- 2", "- 3", dll).
9. "BS" (BARANG SORTIR / TEMBAKAU BS):
   - Sering tertulis di baris paling bawah, di luar tabel, atau pada baris khusus (misal: "(BAHRUDIN) BS - 20  66.2  64" atau "BS 20" atau "BS-25").
   - ATURAN MUTLAK BS:
     * Angka setelah tulisan BS adalah GRADE-nya! (misal "BS - 20" -> "grade": "20", "BS-25" -> "grade": "25", "BS 18" -> "grade": "18").
     * "ket": diisi "BS" atau "BS - 20".
     * "nama": diisi nama yang tertulis di sampingnya (misal "BAHRUDIN").
     * "kg": diisi berat desimalnya (misal "66.2").
     * "brt_fix": diisi berat bulatnya jika ada (misal "64").
     * "no": diisi nomor urut setelah baris sebelumnya (misal baris sebelumnya 150 -> "no": 151).

PENTING:
- Pastikan angka desimal KG terbaca sangat teliti (.0, .1, .2, .3, .4, .5, .6, .7, .8, .9).
- Kembalikan HANYA format JSON valid tanpa kata pengantar apa pun, seperti:
[
  {"no": 148, "gl": "gl", "gt": "", "nama": "H. HANAN", "grade": "55", "kg": "31.5", "brt_fix": "30", "ket": ""},
  {"no": 149, "gl": "gl", "gt": "", "nama": "(10/8/26)", "grade": "63", "kg": "45.6", "brt_fix": "45", "ket": ""},
  {"no": 150, "gl": "gl", "gt": "", "nama": "", "grade": "63", "kg": "40.7", "brt_fix": "39", "ket": ""},
  {"no": 151, "gl": "", "gt": "", "nama": "BAHRUDIN", "grade": "20", "kg": "66.2", "brt_fix": "64", "ket": "BS - 20"}
]`;

      // Helper function to query live available models from Google ModelService
      async function fetchLiveModels(key, apiVer = 'v1beta') {
        try {
          const listRes = await fetch(`https://generativelanguage.googleapis.com/${apiVer}/models?key=${key}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            if (Array.isArray(listData.models)) {
              return listData.models
                .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace(/^models\//, ''));
            }
          }
        } catch (e) {
          console.warn(`[Vision AI] Gagal mengambil daftar model via ${apiVer}:`, e);
        }
        return [];
      }

      // Build initial priority candidates
      let initialModel = (model || '').replace(/^models\//, '').trim();
      let modelCandidates = [
        initialModel,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-pro',
        'gemini-1.5-pro'
      ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

      let response = null;
      let workingModel = null;
      let lastError = null;

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

      // Pass 1: Try candidate list on v1beta
      for (let i = 0; i < modelCandidates.length; i++) {
        const candidate = modelCandidates[i];
        try {
          if (i > 0) {
            progressStatus.textContent = `Mencoba model AI: ${candidate}...`;
          }

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
          });

          if (res.ok) {
            response = res;
            workingModel = candidate;
            localStorage.setItem(MODEL_STORAGE, candidate);
            console.log(`[Vision AI] Berhasil terhubung dengan model: ${candidate}`);
            break;
          }

          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson.error?.message || `HTTP ${res.status}`;
          lastError = new Error(errMsg);

          if (res.status === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not supported')) {
            console.warn(`[Vision AI] Model ${candidate} tidak tersedia (${errMsg}), mencoba alternatif...`);
            continue;
          } else {
            throw lastError;
          }
        } catch (callErr) {
          if (callErr.message && (callErr.message.includes('API_KEY_INVALID') || callErr.message.includes('quota') || callErr.message.includes('RESOURCE_EXHAUSTED'))) {
            throw callErr;
          }
          lastError = callErr;
        }
      }

      // Pass 2: If candidates failed, dynamically discover live models via ListModels API
      if (!response) {
        progressStatus.textContent = 'Mendeteksi model aktif pada API Key Anda...';
        console.log('[Vision AI] Menghubungi ModelService.ListModels untuk mendeteksi model yang aktif...');
        
        let liveModels = await fetchLiveModels(apiKey, 'v1beta');
        if (liveModels.length === 0) {
          liveModels = await fetchLiveModels(apiKey, 'v1');
        }

        if (liveModels.length > 0) {
          console.log('[Vision AI] Model yang tersedia dari Google:', liveModels);
          // Sort flash models first
          liveModels.sort((a, b) => {
            const aFlash = a.includes('flash') ? -1 : 1;
            const bFlash = b.includes('flash') ? -1 : 1;
            return aFlash - bFlash;
          });

          for (const liveModel of liveModels) {
            try {
              progressStatus.textContent = `Menghubungkan ke ${liveModel}...`;
              const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${liveModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
              });

              if (res.ok) {
                response = res;
                workingModel = liveModel;
                localStorage.setItem(MODEL_STORAGE, liveModel);
                console.log(`[Vision AI] Sukses otomatis via ListModels: ${liveModel}`);
                break;
              }
            } catch (errLoop) {
              lastError = errLoop;
            }
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Tidak dapat menemukan model Gemini Vision yang aktif untuk API Key ini. Pastikan Google Gemini API aktif di Google AI Studio.');
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

          let glVal = String(r.gl || '').trim().toLowerCase();
          let gtVal = String(r.gt || '').trim().toUpperCase();
          let namaVal = String(r.nama || '').trim();

          // Auto-detect if GL / GT was placed in the nama column
          if (namaVal.toLowerCase() === 'gl' || /^gl\b/i.test(namaVal)) {
            glVal = 'gl';
            namaVal = namaVal.replace(/^gl\s*/i, '').trim();
          }
          if (namaVal.toUpperCase() === 'GT' || /^gt\b/i.test(namaVal)) {
            gtVal = 'GT';
            namaVal = namaVal.replace(/^gt\s*/i, '').trim();
          }

          if (glVal.includes('gl')) glVal = 'gl';
          if (gtVal.includes('GT')) gtVal = 'GT';

          const brtVal = calc_brt(r.kg, r.brt_fix);
          const netVal = calc_net(brtVal, glVal);
          const hrgVal = calc_harga(r.grade);

          return {
            no: noVal,
            gl: glVal,
            gt: gtVal,
            nama: namaVal,
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
      { no: 125, gl: 'gl', gt: '', nama: 'AMIR', grade: '65', harga: 64000, kg: '40.4', brt: 39, brt_fix: '39', net: 37, ket: '' },
      { no: 126, gl: 'gl', gt: '', nama: '(10/8/26)', grade: '65', harga: 64000, kg: '30.5', brt: 30, brt_fix: '30', net: 28, ket: '' },
      { no: 127, gl: 'gl', gt: '', nama: '', grade: '65', harga: 64000, kg: '38.5', brt: 38, brt_fix: '38', net: 36, ket: '' },
      { no: 128, gl: 'gl', gt: '', nama: '', grade: '60', harga: 59000, kg: '47.0', brt: 46, brt_fix: '46', net: 44, ket: '' },
      { no: 129, gl: 'gl', gt: '', nama: '', grade: '60', harga: 59000, kg: '45.9', brt: 45, brt_fix: '45', net: 43, ket: '' },
      { no: 130, gl: 'gl', gt: '', nama: 'H. MAHFUD', grade: '57', harga: 56000, kg: '45.9', brt: 44, brt_fix: '44', net: 42, ket: '' },
      { no: 131, gl: 'gl', gt: '', nama: '(10/8/26)', grade: '61', harga: 60000, kg: '42.4', brt: 41, brt_fix: '41', net: 39, ket: '' },
      { no: 132, gl: 'gl', gt: '', nama: '', grade: '52', harga: 51000, kg: '40.1', brt: 39, brt_fix: '39', net: 37, ket: '' },
      { no: 138, gl: 'gl', gt: '', nama: 'Amir', grade: '62', harga: 61000, kg: '48.8', brt: 48, brt_fix: '48', net: 46, ket: '' },
      { no: 139, gl: 'gl', gt: '', nama: '(10/8/26)', grade: '62', harga: 61000, kg: '50.3', brt: 50, brt_fix: '50', net: 48, ket: '' },
      { no: 142, gl: 'gl', gt: '', nama: 'Bahrudin', grade: '40', harga: 39000, kg: '38.3', brt: 37, brt_fix: '37', net: 35, ket: '' },
      { no: 143, gl: 'gl', gt: '', nama: '', grade: '40', harga: 39000, kg: '41.7', brt: 41, brt_fix: '41', net: 39, ket: '' },
      { no: 147, gl: 'gl', gt: '', nama: '', grade: '37', harga: 36000, kg: '48.1', brt: 47, brt_fix: '47', net: 45, ket: '' },
      { no: 148, gl: 'gl', gt: '', nama: 'H. HANAN', grade: '55', harga: 54000, kg: '31.5', brt: 30, brt_fix: '30', net: 28, ket: '' },
      { no: 149, gl: 'gl', gt: '', nama: '(10/8/26)', grade: '63', harga: 62000, kg: '45.6', brt: 45, brt_fix: '45', net: 43, ket: '' },
      { no: 150, gl: 'gl', gt: '', nama: '', grade: '63', harga: 62000, kg: '40.7', brt: 39, brt_fix: '39', net: 37, ket: '' },
      // Baris Khusus BS (Barang Sortir): Jenis tembakau BS, Grade diambil dari angka setelah BS (BS-20 -> Grade 20)
      { no: 151, gl: '', gt: '', nama: '(BAHRUDIN) (10/8 26)', grade: '20', harga: 20000, kg: '66.2', brt: 64, brt_fix: '64', net: 59, ket: 'BS - 20' },
      // Dari Berkas Kurdi (185-199): BRT terisi tulisan tangan checker (masuk ke BRT FIX)
      { no: 185, gl: '', gt: '', nama: 'KURDI', grade: '48', harga: 47000, kg: '45.5', brt: 45, brt_fix: '45', net: 43, ket: '- 2' },
      { no: 186, gl: '', gt: '', nama: '(11/8 26)', grade: '48', harga: 47000, kg: '44.2', brt: 43, brt_fix: '43', net: 41, ket: '- 2' },
      { no: 187, gl: '', gt: '', nama: '', grade: '45', harga: 44000, kg: '42.2', brt: 41, brt_fix: '41', net: 39, ket: '- 2' },
      { no: 188, gl: '', gt: '', nama: '', grade: '48', harga: 47000, kg: '42.2', brt: 41, brt_fix: '41', net: 39, ket: '- 2' },
      { no: 189, gl: '', gt: '', nama: '', grade: '48', harga: 47000, kg: '45.9', brt: 45, brt_fix: '45', net: 43, ket: '- 2' },
      { no: 190, gl: '', gt: '', nama: '', grade: '45', harga: 44000, kg: '38.1', brt: 37, brt_fix: '37', net: 35, ket: '- 2' },
      { no: 194, gl: 'gl', gt: '', nama: '', grade: '32', harga: 31000, kg: '35.5', brt: 35, brt_fix: '35', net: 33, ket: '- 3' },
      { no: 195, gl: 'gl', gt: '', nama: '', grade: '32', harga: 31000, kg: '38.8', brt: 38, brt_fix: '38', net: 36, ket: '- 3' },
      // Dari Berkas H. Hanan & Zakir (200-210): BRT KOSONG di kertas (BRT FIX kosong, BRT dihitung otomatis lewat formula)
      { no: 200, gl: '', gt: '', nama: 'H. HANAN', grade: '65', harga: 64000, kg: '46.6', brt: 46, brt_fix: '', net: 43, ket: '' },
      { no: 201, gl: '', gt: '', nama: '11/8/26', grade: '65', harga: 64000, kg: '47.8', brt: 47, brt_fix: '', net: 44, ket: '' },
      { no: 202, gl: '', gt: '', nama: '(1)', grade: '61', harga: 60000, kg: '38.5', brt: 38, brt_fix: '', net: 35, ket: '' },
      { no: 203, gl: 'gl', gt: '', nama: '', grade: '50', harga: 49000, kg: '29.4', brt: 28, brt_fix: '', net: 26, ket: '' },
      { no: 204, gl: '', gt: '', nama: '', grade: '57', harga: 56000, kg: '36.9', brt: 37, brt_fix: '37', net: 34, ket: '' },
      { no: 205, gl: '', gt: '', nama: '', grade: '55', harga: 54000, kg: '34.0', brt: 34, brt_fix: '', net: 31, ket: '' },
      { no: 206, gl: '', gt: '', nama: 'ZAKIR', grade: '37', harga: 36000, kg: '45.8', brt: 45, brt_fix: '', net: 42, ket: '' },
      { no: 207, gl: '', gt: '', nama: '11/8/26', grade: '37', harga: 36000, kg: '46.7', brt: 46, brt_fix: '', net: 43, ket: '' }
    ];

    renderGridTable();
    showToast('Sampel Berkas Tembakau (Kurdi, H. Hanan, Zakir) berhasil dimuat!', 'success');
  });

  // =========================================================================
  // Nota Number Range & Live Preview Management
  // =========================================================================
  const inputNotaFrom = document.getElementById('inputNotaFrom');
  const inputNotaTo = document.getElementById('inputNotaTo');
  const btnApplyAllRange = document.getElementById('btnApplyAllRange');
  const notaPresetsContainer = document.getElementById('notaPresetsContainer');
  const notaPreviewText = document.getElementById('notaPreviewText');
  const notaPreviewBal = document.getElementById('notaPreviewBal');
  const notaPreviewNet = document.getElementById('notaPreviewNet');
  const notaPreviewRp = document.getElementById('notaPreviewRp');

  function getSelectedNotaRows() {
    if (tobaccoData.length === 0) return { rows: [], from: null, to: null, label: 'Kosong' };

    const fromVal = inputNotaFrom ? parseInt(inputNotaFrom.value.trim(), 10) : NaN;
    const toVal = inputNotaTo ? parseInt(inputNotaTo.value.trim(), 10) : NaN;

    let filtered = [];
    let label = 'Semua Baris';

    if (!isNaN(fromVal) && !isNaN(toVal)) {
      const minNo = Math.min(fromVal, toVal);
      const maxNo = Math.max(fromVal, toVal);
      filtered = tobaccoData.filter(r => {
        const n = parseInt(r.no, 10);
        return !isNaN(n) && n >= minNo && n <= maxNo;
      });

      // Auto-detect farmer name for this range and bundle any separate BS row belonging to this farmer
      const rangeInfo = detectInfo(filtered, minNo);
      const farmerName = (rangeInfo.nama || '').trim().toLowerCase();

      if (farmerName) {
        // Find any BS rows outside the numeric range that match this farmer name
        const extraBsRows = tobaccoData.filter(r => {
          const n = parseInt(r.no, 10);
          const isOutside = isNaN(n) || n < minNo || n > maxNo;
          const isBS = String(r.no || '').toLowerCase().includes('bs') || String(r.ket || '').toLowerCase().includes('bs');
          const rName = String(r.nama || '').toLowerCase();
          return isOutside && isBS && (rName.includes(farmerName) || farmerName.includes(rName.replace(/[()]/g, '').trim()));
        });
        filtered = [...filtered, ...extraBsRows];
      }

      label = `No. ${minNo} s/d ${maxNo}`;
      return { rows: filtered, from: minNo, to: maxNo, label };
    } else if (!isNaN(fromVal)) {
      filtered = tobaccoData.filter(r => {
        const n = parseInt(r.no, 10);
        return isNaN(n) ? true : n >= fromVal;
      });
      return { rows: filtered, from: fromVal, to: null, label: `Mulai No. ${fromVal}` };
    } else if (!isNaN(toVal)) {
      filtered = tobaccoData.filter(r => {
        const n = parseInt(r.no, 10);
        return isNaN(n) ? true : n <= toVal;
      });
      return { rows: filtered, from: null, to: toVal, label: `Sampai No. ${toVal}` };
    }

    return { rows: [...tobaccoData], from: null, to: null, label: 'Semua Baris' };
  }

  const BULAN_INDO = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const BULAN_MAP = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11, "desember": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "agt": 8, "agu": 8, "sep": 9, "okt": 10, "oct": 10, "nov": 11, "des": 12, "dec": 12
  };

  function isDateToken(v) {
    if (!v) return false;
    const s = String(v).trim().replace(/[()]/g, '');
    if (/^\d{1,2}\s*[/\-.]\s*\d{1,2}\s*[/\-.]\s*\d{2,4}$/.test(s)) return true;
    const match = s.match(/^\d{1,2}\s+([A-Za-z]+)\s+(\d{2,4})$/);
    return !!(match && BULAN_MAP[match[1].toLowerCase()]);
  }

  function formatIndoDate(v) {
    if (!v) return '';
    const s = String(v).trim().replace(/[()]/g, '');
    const numMatch = s.match(/^(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})$/);
    if (numMatch) {
      const d = parseInt(numMatch[1], 10);
      let mth = parseInt(numMatch[2], 10);
      let y = parseInt(numMatch[3], 10);
      if (y < 100) y += 2000;
      mth = Math.min(Math.max(mth, 1), 12);
      return `${d} ${BULAN_INDO[mth]} ${y}`;
    }
    const textMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
    if (textMatch && BULAN_MAP[textMatch[2].toLowerCase()]) {
      const d = parseInt(textMatch[1], 10);
      const mth = BULAN_MAP[textMatch[2].toLowerCase()];
      let y = parseInt(textMatch[3], 10);
      if (y < 100) y += 2000;
      return `${d} ${BULAN_INDO[mth]} ${y}`;
    }
    return s;
  }

  function detectInfo(rows, startNo) {
    const items = [];
    rows.forEach(r => {
      const v = String(r.nama || '').trim();
      if (v && !['gl', 'gt'].includes(v.toLowerCase())) {
        items.push({ no: r.no, text: v, isDate: isDateToken(v) });
      }
    });

    const dateIdx = items.findIndex(item => item.isDate);
    let nama = '';
    let tanggal = '';
    let alamat = '';

    if (dateIdx !== -1) {
      tanggal = formatIndoDate(items[dateIdx].text);
      for (let i = dateIdx - 1; i >= 0; i--) {
        if (!items[i].isDate) { nama = items[i].text; break; }
      }
      for (let i = dateIdx + 1; i < items.length; i++) {
        if (!items[i].isDate) { alamat = items[i].text; break; }
      }
    } else {
      const texts = items.filter(item => !item.isDate);
      if (texts.length > 0) nama = texts[0].text;
      if (texts.length > 1) alamat = texts[1].text;
    }

    if (!nama && startNo !== null && tobaccoData.length > 0) {
      const allBefore = tobaccoData.filter(r => parseInt(r.no, 10) < startNo);
      for (let i = allBefore.length - 1; i >= 0; i--) {
        const v = String(allBefore[i].nama || '').trim();
        if (v && !isDateToken(v) && !['gl', 'gt'].includes(v.toLowerCase())) {
          nama = v;
          break;
        }
      }
    }

    return {
      nama: nama || '',
      tanggal: tanggal || '',
      alamat: alamat || ''
    };
  }

  function updateNotaLiveSummary(autoFillHeaders = true) {
    const { rows, from: startNo, label } = getSelectedNotaRows();

    let totalNet = 0;
    let sumJumlah = 0;
    let gtCount = 0;

    rows.forEach(r => {
      const n = parseFloat(r.net) || 0;
      const h = parseFloat(r.harga) || 0;
      totalNet += n;
      sumJumlah += (n * h);

      if (String(r.gt || '').toUpperCase().trim() === 'GT' || String(r.ket || '').toUpperCase().includes('GT')) {
        gtCount++;
      }
    });

    const info = detectInfo(rows, startNo);
    const autoNama = info.nama;
    const autoTanggal = info.tanggal;
    const autoAlamat = info.alamat;

    const pphVal = Math.ceil((sumJumlah * 0.005) / 5000) * 5000;
    const koliVal = rows.length * 5000;
    const gtVal = gtCount * 65000;
    const totalBersih = sumJumlah - pphVal - koliVal - gtVal;

    if (notaPreviewText) notaPreviewText.textContent = `Memilih ${label} (${rows.length} Bal)`;
    if (notaPreviewBal) notaPreviewBal.textContent = rows.length;
    if (notaPreviewNet) notaPreviewNet.textContent = `${Math.round(totalNet)} kg`;
    if (notaPreviewRp) {
      notaPreviewRp.textContent = `Rp ${Math.round(totalBersih).toLocaleString('id-ID')}`;
    }

    if (autoFillHeaders) {
      if (inputNotaNama && !inputNotaNama.dataset.userEdited) inputNotaNama.value = autoNama || '';
      if (inputNotaTanggal && !inputNotaTanggal.dataset.userEdited) inputNotaTanggal.value = autoTanggal || '';
      if (inputNotaAlamat && !inputNotaAlamat.dataset.userEdited) inputNotaAlamat.value = autoAlamat || '';
    }
  }

  function renderNotaPresets() {
    if (!notaPresetsContainer) return;
    notaPresetsContainer.innerHTML = '';
    if (tobaccoData.length === 0) return;

    // Detect clusters / batches based on filled names or contiguous ranges
    const batches = [];
    let currentBatch = null;

    tobaccoData.forEach(r => {
      const num = parseInt(r.no, 10);
      const name = String(r.nama || '').trim();
      const isHeaderName = name && !name.includes('/') && !name.includes('-') && !/^\d+$/.test(name) && !['gl', 'gt'].includes(name.toLowerCase());

      if (isHeaderName || !currentBatch) {
        if (currentBatch && currentBatch.items.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = {
          name: isHeaderName ? name : (currentBatch ? currentBatch.name : 'Kelompok'),
          startNo: num || 1,
          endNo: num || 1,
          items: [r]
        };
      } else {
        currentBatch.endNo = num || currentBatch.endNo;
        currentBatch.items.push(r);
      }
    });
    if (currentBatch && currentBatch.items.length > 0) {
      batches.push(currentBatch);
    }

    // 1. "Semua" button chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'preset-chip active';
    allChip.innerHTML = '<i data-lucide="layers"></i> Semua';
    allChip.addEventListener('click', () => {
      if (inputNotaFrom) inputNotaFrom.value = '';
      if (inputNotaTo) inputNotaTo.value = '';
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      allChip.classList.add('active');
      updateNotaLiveSummary(true);
    });
    notaPresetsContainer.appendChild(allChip);

    // 2. Batch chips per detected name
    batches.forEach(b => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      const labelName = b.name.length > 12 ? b.name.substring(0, 10) + '..' : b.name;
      chip.innerHTML = `${labelName} (${b.startNo}-${b.endNo})`;
      chip.addEventListener('click', () => {
        if (inputNotaFrom) inputNotaFrom.value = b.startNo;
        if (inputNotaTo) inputNotaTo.value = b.endNo;
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (inputNotaNama) inputNotaNama.dataset.userEdited = '';
        if (inputNotaTanggal) inputNotaTanggal.dataset.userEdited = '';
        updateNotaLiveSummary(true);
        showToast(`Memilih Nota No. ${b.startNo} s/d ${b.endNo} (${b.name})`, 'info', 3000);
      });
      notaPresetsContainer.appendChild(chip);
    });

    if (window.lucide) lucide.createIcons();
  }

  [inputNotaFrom, inputNotaTo].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', () => {
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        if (inputNotaNama) inputNotaNama.dataset.userEdited = '';
        if (inputNotaTanggal) inputNotaTanggal.dataset.userEdited = '';
        updateNotaLiveSummary(true);
      });
    }
  });

  [inputNotaNama, inputNotaTanggal, inputNotaAlamat].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', () => {
        inp.dataset.userEdited = 'true';
      });
    }
  });

  if (btnApplyAllRange) {
    btnApplyAllRange.addEventListener('click', () => {
      if (inputNotaFrom) inputNotaFrom.value = '';
      if (inputNotaTo) inputNotaTo.value = '';
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      const firstChip = document.querySelector('.preset-chip');
      if (firstChip) firstChip.classList.add('active');
      if (inputNotaNama) inputNotaNama.dataset.userEdited = '';
      if (inputNotaTanggal) inputNotaTanggal.dataset.userEdited = '';
      updateNotaLiveSummary(true);
      showToast('Memilih seluruh baris data', 'info', 2000);
    });
  }

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

    const { rows: filteredRows, from: startNo, to: endNo, label } = getSelectedNotaRows();

    if (filteredRows.length === 0) {
      showToast(`Tidak ada data baris pada rentang ${label}`, 'error');
      return;
    }

    // Auto discover headers from the filtered subset using Python-matching detectInfo
    const info = detectInfo(filteredRows, startNo);
    const finalNama = (inputNotaNama && inputNotaNama.value.trim()) || info.nama || 'Nama Penjual';
    const finalTanggal = (inputNotaTanggal && inputNotaTanggal.value.trim()) || info.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const finalAlamat = (inputNotaAlamat && inputNotaAlamat.value.trim()) || info.alamat || 'Pegantenan';

    // Build Exact Layout
    // Row 1: Logo & Title
    // Row 3: Nama
    // Row 4: Alamat
    // Row 5: Tgl/Hr/Thn
    // Row 7: Header Table
    const wsData = [
      ['', 'NOTA PEMBELIAN TEMBAKAU 2026'],
      [],
      ['Nama    :', finalNama],
      ['Alamat  :', finalAlamat],
      ['Tgl/Hr/Thn :', finalTanggal],
      [],
      ['No. GUD', 'BRUTO', 'NETTO', 'HARGA', 'JUMLAH']
    ];

    let sumBruto = 0;
    let sumNetto = 0;
    let sumJumlah = 0;
    let gtCount = 0;

    const dataStartRow = 8; // Row 8 in Excel (1-indexed)

    filteredRows.forEach((r, idx) => {
      const curRow = dataStartRow + idx;
      let noGud = String(r.no || (idx + 1));
      const ketStr = String(r.ket || '').toLowerCase();
      const noStr = String(r.no || '').toLowerCase();
      const isBS = ketStr.includes('bs') || noStr.includes('bs');

      if (isBS) {
        const numVal = parseInt(r.no, 10);
        if (!isNaN(numVal)) {
          noGud = `${numVal} BS`;
        } else {
          const prevNums = filteredRows.map(x => parseInt(x.no, 10)).filter(x => !isNaN(x));
          const baseNo = prevNums.length > 0 ? Math.max(...prevNums) + 1 : (idx + 1);
          noGud = `${baseNo} BS`;
        }
      } else if (String(r.gt || '').toUpperCase().trim() === 'GT') {
        noGud = `GT ${r.no}`;
        gtCount++;
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
        { t: 'n', f: `C${curRow}*D${curRow}`, v: jml }
      ]);
    });

    const dataEndRow = dataStartRow + filteredRows.length - 1;
    const jumlahRow = dataEndRow + 1; // Excel row for JUMLAH
    const pphRow = jumlahRow + 1;
    const koliRow = pphRow + 1;

    const pphVal = Math.ceil((sumJumlah * 0.005) / 5000) * 5000;
    const koliVal = filteredRows.length * 5000;
    const gtVal = gtCount * 65000;

    // Row: JUMLAH
    wsData.push([
      '',
      '',
      '',
      'JUMLAH',
      { t: 'n', f: `SUM(E${dataStartRow}:E${dataEndRow})`, v: sumJumlah }
    ]);

    // Row: PPH 0,5%
    wsData.push([
      '',
      '',
      '',
      'PPH 0,5%',
      { t: 'n', f: `CEILING(E${jumlahRow}*0.005, 5000)`, v: pphVal }
    ]);

    // Row: Koli
    wsData.push([
      '',
      '',
      '',
      'Koli',
      { t: 'n', f: `COUNTA(A${dataStartRow}:A${dataEndRow})*5000`, v: koliVal }
    ]);

    let totalFormula = `E${jumlahRow}-E${pphRow}-E${koliRow}`;
    let totalBersih = sumJumlah - pphVal - koliVal;

    // Row: GT (if any GT exists)
    if (gtCount > 0) {
      const gtRow = koliRow + 1;
      wsData.push([
        '',
        '',
        '',
        'GT',
        { t: 'n', f: `COUNTIF(A${dataStartRow}:A${dataEndRow}, "GT*")*65000`, v: gtVal }
      ]);
      totalFormula += `-E${gtRow}`;
      totalBersih -= gtVal;
    }

    // Row: TOTAL
    wsData.push([
      '',
      '',
      '',
      'TOTAL',
      { t: 'n', f: totalFormula, v: totalBersih }
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 14 },
      { wch: 11 },
      { wch: 11 },
      { wch: 15 },
      { wch: 18 }
    ];

    // Setup print fit to 1-page A4 Portrait
    ws['!pageSetup'] = {
      orientation: 'portrait',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };
    ws['!margins'] = {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2
    };

    const rangeTag = startNo && endNo ? `${startNo}-${endNo}` : (startNo ? `Mulai-${startNo}` : 'Lengkap');
    XLSX.utils.book_append_sheet(wb, ws, `Nota ${rangeTag}`);

    const safeName = finalNama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Nota_${safeName}_${rangeTag}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Nota Pembelian berhasil dibuat -> ${filename} (${filteredRows.length} bal)`, 'success', 5000);
  });

  // =========================================================================
  // Print Nota Modal (A4 Ready with Tobacco Logo & Solid Borders)
  // =========================================================================
  const btnOpenPrintNota = document.getElementById('btnOpenPrintNota');
  const printNotaModal = document.getElementById('printNotaModal');
  const printModalBackdrop = document.getElementById('printModalBackdrop');
  const btnClosePrintModal = document.getElementById('btnClosePrintModal');
  const btnClosePrintModalBtn = document.getElementById('btnClosePrintModalBtn');
  const btnExecutePrint = document.getElementById('btnExecutePrint');
  const btnDownloadFromPrint = document.getElementById('btnDownloadFromPrint');
  const printableNotaSheet = document.getElementById('printableNotaSheet');

  function renderPrintableSheet() {
    if (!printableNotaSheet) return;
    const { rows: filteredRows, from: startNo } = getSelectedNotaRows();

    if (filteredRows.length === 0) {
      showToast('Tidak ada data baris untuk dicetak', 'error');
      return false;
    }

    const info = detectInfo(filteredRows, startNo);
    const finalNama = (inputNotaNama && inputNotaNama.value.trim()) || info.nama || 'Nama Penjual';
    const finalTanggal = (inputNotaTanggal && inputNotaTanggal.value.trim()) || info.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const finalAlamat = (inputNotaAlamat && inputNotaAlamat.value.trim()) || info.alamat || 'Pegantenan';

    let sumBruto = 0;
    let sumNetto = 0;
    let sumJumlah = 0;
    let gtCount = 0;

    let rowsHtml = '';
    filteredRows.forEach((r, idx) => {
      let noGud = String(r.no || (idx + 1));
      const ketStr = String(r.ket || '').toLowerCase();
      const noStr = String(r.no || '').toLowerCase();
      const isBS = ketStr.includes('bs') || noStr.includes('bs');

      if (isBS) {
        const numVal = parseInt(r.no, 10);
        if (!isNaN(numVal)) {
          noGud = `${numVal} BS`;
        } else {
          const prevNums = filteredRows.map(x => parseInt(x.no, 10)).filter(x => !isNaN(x));
          const baseNo = prevNums.length > 0 ? Math.max(...prevNums) + 1 : (idx + 1);
          noGud = `${baseNo} BS`;
        }
      } else if (String(r.gt || '').toUpperCase().trim() === 'GT') {
        noGud = `GT ${r.no}`;
        gtCount++;
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

      rowsHtml += `
        <tr>
          <td>${escapeHtml(noGud)}</td>
          <td>${brt}</td>
          <td>${net}</td>
          <td class="align-right">${hrg.toLocaleString('id-ID')}</td>
          <td class="align-right">${jml.toLocaleString('id-ID')}</td>
        </tr>
      `;
    });

    const pphVal = Math.ceil((sumJumlah * 0.005) / 5000) * 5000;
    const koliVal = filteredRows.length * 5000;
    const gtVal = gtCount * 65000;
    const totalBersih = sumJumlah - pphVal - koliVal - gtVal;

    let gtRowHtml = '';
    if (gtCount > 0) {
      gtRowHtml = `
        <tr class="footer-row">
          <td colspan="3" style="border: none !important;"></td>
          <td class="align-right">GT (${gtCount})</td>
          <td class="align-right">Rp ${gtVal.toLocaleString('id-ID')}</td>
        </tr>
      `;
    }

    printableNotaSheet.innerHTML = `
      <div class="nota-print-header">
        <img src="logo.png" alt="Logo Tembakau" class="nota-print-logo" onerror="this.style.display='none'" />
        <div class="nota-print-title-wrap">
          <h2>NOTA PEMBELIAN TEMBAKAU 2026</h2>
        </div>
      </div>

      <div class="nota-print-identity">
        <div class="identity-row">
          <span class="identity-lbl">Nama</span>
          <span class="identity-val">: &nbsp; ${escapeHtml(finalNama)}</span>
        </div>
        <div class="identity-row">
          <span class="identity-lbl">Alamat</span>
          <span class="identity-val">: &nbsp; ${escapeHtml(finalAlamat)}</span>
        </div>
        <div class="identity-row">
          <span class="identity-lbl">Tgl/Hr/Thn</span>
          <span class="identity-val">: &nbsp; ${escapeHtml(finalTanggal)}</span>
        </div>
      </div>

      <table class="nota-print-table">
        <thead>
          <tr>
            <th style="width: 20%;">No. GUD</th>
            <th style="width: 15%;">BRUTO</th>
            <th style="width: 15%;">NETTO</th>
            <th style="width: 22%;">HARGA</th>
            <th style="width: 28%;">JUMLAH</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="footer-row">
            <td colspan="3" style="border: none !important;"></td>
            <td class="align-right">JUMLAH</td>
            <td class="align-right">${sumJumlah.toLocaleString('id-ID')}</td>
          </tr>
          <tr class="footer-row">
            <td colspan="3" style="border: none !important;"></td>
            <td class="align-right">PPH 0,5%</td>
            <td class="align-right">${pphVal.toLocaleString('id-ID')}</td>
          </tr>
          <tr class="footer-row">
            <td colspan="3" style="border: none !important;"></td>
            <td class="align-right">Koli</td>
            <td class="align-right">Rp ${koliVal.toLocaleString('id-ID')}</td>
          </tr>
          ${gtRowHtml}
          <tr class="total-row">
            <td colspan="3" style="border: none !important;"></td>
            <td class="align-right">TOTAL</td>
            <td class="align-right">Rp ${totalBersih.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>

      <div class="nota-signatures">
        <div class="sig-box">
          <div class="sig-title">Yang Menerima,</div>
          <div class="sig-line">( ........................................ )</div>
        </div>
        <div class="sig-box">
          <div class="sig-title">Penerima / Kasir,</div>
          <div class="sig-line">( ........................................ )</div>
        </div>
      </div>
    `;

    return true;
  }

  if (btnOpenPrintNota) {
    btnOpenPrintNota.addEventListener('click', () => {
      if (tobaccoData.length === 0) {
        showToast('Tidak ada data untuk dicetak', 'error');
        return;
      }
      if (renderPrintableSheet()) {
        printNotaModal.classList.add('active');
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  [btnClosePrintModal, btnClosePrintModalBtn, printModalBackdrop].forEach(el => {
    if (el) {
      el.addEventListener('click', () => {
        printNotaModal.classList.remove('active');
      });
    }
  });

  if (btnExecutePrint) {
    btnExecutePrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnDownloadFromPrint) {
    btnDownloadFromPrint.addEventListener('click', () => {
      btnGenerateNota.click();
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

});

