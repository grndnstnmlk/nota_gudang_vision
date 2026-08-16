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
  // =========================================================================
  // Multi-Photo & Interactive Viewer State
  // =========================================================================
  let uploadedImages = []; // Array of { id, name, src, base64 }
  let activeImageIndex = 0;
  let zoomScale = 1.0;
  let rotateAngle = 0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  const photoGalleryStrip = document.getElementById('photoGalleryStrip');
  const previewImageWrapper = document.getElementById('previewImageWrapper');
  const btnAiScanText = document.getElementById('btnAiScanText');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomReset = document.getElementById('btnZoomReset');
  const btnRotateImg = document.getElementById('btnRotateImg');
  const btnToggleSideBySide = document.getElementById('btnToggleSideBySide');
  const workspaceGrid = document.querySelector('.workspace-grid');

  function updateViewerTransform() {
    if (!previewImage) return;
    previewImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale}) rotate(${rotateAngle}deg)`;
  }

  function resetViewerTransform() {
    zoomScale = 1.0;
    rotateAngle = 0;
    panX = 0;
    panY = 0;
    updateViewerTransform();
  }

  function setActiveImage(index) {
    if (index < 0 || index >= uploadedImages.length) return;
    activeImageIndex = index;
    currentImageSrc = uploadedImages[index].src;
    previewImage.src = currentImageSrc;
    resetViewerTransform();
    renderGalleryStrip();
    updateAiScanButtonText();
  }

  function removeImageByIndex(index) {
    if (index < 0 || index >= uploadedImages.length) return;
    uploadedImages.splice(index, 1);
    if (uploadedImages.length === 0) {
      currentImageSrc = null;
      previewImage.src = '';
      dropzone.style.display = 'block';
      previewContainer.style.display = 'none';
      previewActions.style.display = 'none';
      progressBox.style.display = 'none';
    } else {
      if (activeImageIndex >= uploadedImages.length) {
        activeImageIndex = uploadedImages.length - 1;
      }
      setActiveImage(activeImageIndex);
    }
    renderGalleryStrip();
  }

  function updateAiScanButtonText() {
    if (!btnAiScanText) return;
    if (uploadedImages.length > 1) {
      btnAiScanText.textContent = `Ekstrak SEMUA Foto (${uploadedImages.length} Halaman Berkas)`;
    } else {
      btnAiScanText.textContent = `Ekstrak dengan Vision AI (100% Akurat)`;
    }
  }

  function renderGalleryStrip() {
    if (!photoGalleryStrip) return;
    photoGalleryStrip.innerHTML = '';
    if (uploadedImages.length <= 1) {
      photoGalleryStrip.style.display = 'none';
      return;
    }
    photoGalleryStrip.style.display = 'flex';

    uploadedImages.forEach((imgObj, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `gallery-thumb ${idx === activeImageIndex ? 'active' : ''}`;
      thumb.title = `${imgObj.name} (Klik untuk melihat)`;
      thumb.innerHTML = `
        <img src="${imgObj.src}" alt="${imgObj.name}" />
        <span class="gallery-thumb-badge">${idx + 1}</span>
        <button type="button" class="gallery-thumb-delete" title="Hapus foto ini">&times;</button>
      `;

      thumb.addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-thumb-delete')) {
          e.stopPropagation();
          removeImageByIndex(idx);
          return;
        }
        setActiveImage(idx);
      });

      photoGalleryStrip.appendChild(thumb);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'gallery-add-btn';
    addBtn.title = 'Tambah foto berkas berikutnya';
    addBtn.innerHTML = `<i data-lucide="plus"></i><span>+ Foto</span>`;
    addBtn.addEventListener('click', () => fileInput.click());
    photoGalleryStrip.appendChild(addBtn);

    if (window.lucide) lucide.createIcons();
  }

  function addUploadedImages(files) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    let loadedCount = 0;

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        const base64 = src.split(',')[1];
        uploadedImages.push({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: file.name || `Foto ${uploadedImages.length + 1}`,
          src,
          base64
        });
        loadedCount++;

        if (loadedCount === fileArray.length) {
          dropzone.style.display = 'none';
          previewContainer.style.display = 'flex';
          previewActions.style.display = 'flex';
          setActiveImage(uploadedImages.length - loadedCount);
          renderGalleryStrip();
          showToast(`${fileArray.length} foto berkas berhasil dimuat!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // =========================================================================
  // Image Upload & Source Handling
  // =========================================================================
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addUploadedImages(e.target.files);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addUploadedImages(e.dataTransfer.files);
    }
  });

  // Preprocessing Image Filters
  document.querySelectorAll('.btn-filter-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter-mode').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      previewImage.classList.remove('filter-high-contrast', 'filter-brighten', 'filter-invert');
      if (filter === 'high-contrast') previewImage.classList.add('filter-high-contrast');
      if (filter === 'brighten') previewImage.classList.add('filter-brighten');
      if (filter === 'invert') previewImage.classList.add('filter-invert');
    });
  });

  // Interactive Zoom & Pan Controls
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      zoomScale = Math.min(4.0, zoomScale + 0.25);
      updateViewerTransform();
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      zoomScale = Math.max(0.5, zoomScale - 0.25);
      updateViewerTransform();
    });
  }

  if (btnZoomReset) {
    btnZoomReset.addEventListener('click', resetViewerTransform);
  }

  if (btnRotateImg) {
    btnRotateImg.addEventListener('click', () => {
      rotateAngle = (rotateAngle + 90) % 360;
      updateViewerTransform();
    });
  }

  if (previewImageWrapper) {
    previewImageWrapper.addEventListener('mousedown', (e) => {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateViewerTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
    });

    previewImageWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomScale = Math.min(4.0, zoomScale + 0.15);
      } else {
        zoomScale = Math.max(0.5, zoomScale - 0.15);
      }
      updateViewerTransform();
    });
  }

  // Side-by-Side Review Mode Toggle
  if (btnToggleSideBySide && workspaceGrid) {
    btnToggleSideBySide.addEventListener('click', () => {
      const isActive = workspaceGrid.classList.toggle('side-by-side-mode');
      btnToggleSideBySide.classList.toggle('active', isActive);
      showToast(isActive ? 'Mode Berdampingan Aktif: Foto & Tabel Berdampingan' : 'Mode Normal Aktif', 'info', 2500);
      if (window.lucide) lucide.createIcons();
    });
  }

  // =========================================================================
  // Source Mode Tabs (Foto Berkas vs Upload Excel Buku Sortir)
  // =========================================================================
  const tabModePhoto = document.getElementById('tabModePhoto');
  const tabModeExcel = document.getElementById('tabModeExcel');
  const panelSourcePhoto = document.getElementById('panelSourcePhoto');
  const panelSourceExcel = document.getElementById('panelSourceExcel');

  if (tabModePhoto && tabModeExcel) {
    tabModePhoto.addEventListener('click', () => {
      tabModePhoto.classList.add('active');
      tabModeExcel.classList.remove('active');
      if (panelSourcePhoto) panelSourcePhoto.style.display = 'block';
      if (panelSourceExcel) panelSourceExcel.style.display = 'none';
      if (window.lucide) lucide.createIcons();
    });

    tabModeExcel.addEventListener('click', () => {
      tabModeExcel.classList.add('active');
      tabModePhoto.classList.remove('active');
      if (panelSourcePhoto) panelSourcePhoto.style.display = 'none';
      if (panelSourceExcel) panelSourceExcel.style.display = 'block';
      if (window.lucide) lucide.createIcons();
    });
  }

  // =========================================================================
  // Direct Excel (xlsx 1) Buku Sortir Upload Engine
  // =========================================================================
  const dropzoneExcel = document.getElementById('dropzoneExcel');
  const excelFileInput = document.getElementById('excelFileInput');
  const btnPickExcel = document.getElementById('btnPickExcel');
  const btnLoadSampleBukuSortir = document.getElementById('btnLoadSampleBukuSortir');

  async function loadExcelBukuSortir(arrayBuffer, fileName) {
    try {
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        showToast('Sheet Excel tidak ditemukan', 'error');
        return;
      }

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rows.length < 3) {
        showToast('Format Excel memiliki terlalu sedikit baris', 'error');
        return;
      }

      // Find Header Row: look for row containing NO, GRADE, KG or NAMA
      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowTexts = rows[i].map(x => String(x).toUpperCase().trim());
        if (rowTexts.includes('NO') && (rowTexts.includes('GRADE') || rowTexts.includes('KG') || rowTexts.includes('NAMA'))) {
          headerRowIdx = i;
          break;
        }
      }

      if (headerRowIdx === -1) {
        headerRowIdx = 2; // Default to row 3 (0-indexed 2)
      }

      const headerRow = rows[headerRowIdx].map(x => String(x).toUpperCase().trim());
      
      const getColIdx = (names) => {
        for (const name of names) {
          const idx = headerRow.indexOf(name);
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const c_gl = getColIdx(['GL']);
      const c_no = getColIdx(['NO', 'NO.', 'NOMOR']);
      const c_gt = getColIdx(['GT']);
      const c_nama = getColIdx(['NAMA', 'PETANI', 'NAMA PETANI']);
      const c_grade = getColIdx(['GRADE', 'GRD']);
      const c_harga = getColIdx(['HARGA', 'HRG']);
      const c_kg = getColIdx(['KG', 'BERAT KG', 'KILOGRAM']);
      const c_brt = getColIdx(['BRT', 'BRUTO']);
      const c_brtfix = getColIdx(['BRT FIX', 'BRT_FIX', 'BRUTO FIX']);
      const c_net = getColIdx(['NET', 'NETTO']);
      const c_ket = getColIdx(['KET', 'KETERANGAN']);

      const parsedData = [];

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const noRaw = c_no !== -1 ? row[c_no] : '';
        const gradeRaw = c_grade !== -1 ? row[c_grade] : '';
        const kgRaw = c_kg !== -1 ? row[c_kg] : '';
        const namaRaw = c_nama !== -1 ? row[c_nama] : '';
        const glRaw = c_gl !== -1 ? row[c_gl] : '';
        const gtRaw = c_gt !== -1 ? row[c_gt] : '';
        const brtRaw = c_brt !== -1 ? row[c_brt] : '';
        const brtFixRaw = c_brtfix !== -1 ? row[c_brtfix] : '';
        const netRaw = c_net !== -1 ? row[c_net] : '';
        const hrgRaw = c_harga !== -1 ? row[c_harga] : '';
        const ketRaw = c_ket !== -1 ? row[c_ket] : '';

        // Check for companion BS block in columns L..R (0-indexed 11..17)
        const markBsRaw = row[11] !== undefined ? row[11] : '';
        const ketBsRaw = row[10] !== undefined ? row[10] : '';
        const hasBsBlock = (String(markBsRaw).trim().toLowerCase() === 'bs' || String(ketBsRaw).trim().toLowerCase().includes('bs')) &&
                           (row[13] !== undefined || row[14] !== undefined || row[15] !== undefined || row[16] !== undefined || row[17] !== undefined);
        let bsInfo = null;
        if (hasBsBlock) {
          const bsGrd = row[13] !== undefined ? String(row[13]).trim() : '';
          const bsHrgRaw = row[14] !== undefined ? row[14] : '';
          const bsKgRaw = row[15] !== undefined ? row[15] : '';
          const bsBrtRaw = row[16] !== undefined ? row[16] : '';
          const bsNetRaw = row[17] !== undefined ? row[17] : '';
          const bsHrg = (bsHrgRaw !== '' && !String(bsHrgRaw).startsWith('=')) ? Number(bsHrgRaw) : calc_harga(bsGrd, bsHrgRaw);
          const bsBrt = (bsBrtRaw !== '' && !String(bsBrtRaw).startsWith('=')) ? Number(bsBrtRaw) : calc_brt(bsKgRaw);
          const bsNet = (bsNetRaw !== '' && !String(bsNetRaw).startsWith('=')) ? Number(bsNetRaw) : calc_net(bsBrt);
          if (bsHrg || bsBrt || bsNet) {
            bsInfo = {
              grade: bsGrd,
              harga: bsHrg || 0,
              kg: bsKgRaw,
              brt: bsBrt || 0,
              net: bsNet || 0
            };
          }
        }

        // Ignore completely empty row
        if (!noRaw && !gradeRaw && !kgRaw && !namaRaw && !ketRaw && !bsInfo) continue;

        let glVal = String(glRaw).trim().toLowerCase();
        let gtVal = String(gtRaw).trim().toUpperCase();
        let namaVal = String(namaRaw).trim();

        // Handle when GL or G or GT was written in the NAMA column
        if (namaVal.toLowerCase() === 'gl' || namaVal.toLowerCase() === 'g' || /^gl\b/i.test(namaVal) || /^g\s+[a-z]/i.test(namaVal)) {
          glVal = 'gl';
          namaVal = namaVal.replace(/^gl\s*/i, '').replace(/^g\s+/i, '').trim();
          if (namaVal.toLowerCase() === 'g') namaVal = '';
        }
        if (namaVal.toUpperCase() === 'GT' || /^gt\b/i.test(namaVal)) {
          gtVal = 'GT';
          namaVal = namaVal.replace(/^gt\s*/i, '').trim();
        }

        if (glVal.includes('gl') || glVal === 'g') glVal = 'gl';
        else glVal = '';
        if (gtVal.includes('GT') || gtVal === 'GT') gtVal = 'GT';
        else gtVal = '';

        const brtVal = (brtFixRaw !== '' && !String(brtFixRaw).startsWith('=')) 
          ? Number(brtFixRaw) 
          : ((brtRaw !== '' && !String(brtRaw).startsWith('=')) ? Number(brtRaw) : calc_brt(kgRaw, brtFixRaw));
        const hrgVal = (hrgRaw !== '' && !String(hrgRaw).startsWith('=')) 
          ? Number(hrgRaw) 
          : calc_harga(gradeRaw, hrgRaw);
        const netVal = (netRaw !== '' && !String(netRaw).startsWith('=')) 
          ? Number(netRaw) 
          : calc_net(brtVal, glVal);

        parsedData.push({
          no: noRaw !== '' ? (isNaN(Number(noRaw)) ? String(noRaw).trim() : Number(noRaw)) : (parsedData.length + 1),
          gl: glVal,
          gt: gtVal,
          nama: namaVal,
          grade: String(gradeRaw).trim(),
          harga: hrgVal || '',
          kg: String(kgRaw).trim(),
          brt: brtVal || '',
          brt_fix: (brtFixRaw !== '' && !String(brtFixRaw).startsWith('=')) ? String(brtFixRaw).trim() : '',
          net: netVal || '',
          ket: String(ketRaw).trim(),
          bs_info: bsInfo
        });
      }

      if (parsedData.length === 0) {
        showToast('Tidak ada data baris valid di file Excel tersebut', 'error');
        return;
      }

      tobaccoData = parsedData;
      renderGridTable();
      updateStats();
      renderNotaPresets();

      const excelLoadedInfo = document.getElementById('excelLoadedInfo');
      const excelFileName = document.getElementById('excelFileName');
      const excelFileStats = document.getElementById('excelFileStats');
      if (excelLoadedInfo && excelFileName && excelFileStats) {
        excelFileName.textContent = fileName || 'Buku_Sortir.xlsx';
        excelFileStats.textContent = `${parsedData.length} baris bal tembakau berhasil dimuat & siap dibuatkan nota`;
        excelLoadedInfo.style.display = 'block';
      }

      showToast(`Berhasil memuat ${parsedData.length} baris dari ${fileName || 'Excel'}!`, 'success', 5000);
    } catch (err) {
      console.error('[Excel Upload Error]:', err);
      showToast(`Gagal membaca Excel: ${err.message}`, 'error');
    }
  }

  if (btnPickExcel && excelFileInput) {
    btnPickExcel.addEventListener('click', (e) => {
      e.stopPropagation();
      excelFileInput.click();
    });
  }

  if (excelFileInput) {
    excelFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        loadExcelBukuSortir(evt.target.result, file.name);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  if (dropzoneExcel) {
    dropzoneExcel.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneExcel.classList.add('drag-over');
    });

    dropzoneExcel.addEventListener('dragleave', () => {
      dropzoneExcel.classList.remove('drag-over');
    });

    dropzoneExcel.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneExcel.classList.remove('drag-over');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          loadExcelBukuSortir(evt.target.result, file.name);
        };
        reader.readAsArrayBuffer(file);
      }
    });
  }

  if (btnLoadSampleBukuSortir) {
    btnLoadSampleBukuSortir.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const res = await fetch('Buku_Soter_1-1000 GREEND.xlsx');
        if (!res.ok) throw new Error('File contoh tidak ditemukan');
        const buf = await res.arrayBuffer();
        await loadExcelBukuSortir(buf, 'Buku_Soter_1-1000 GREEND.xlsx');
      } catch (err) {
        showToast('Gagal memuat sample buku sortir: ' + err.message, 'error');
      }
    });
  }

  btnResetPhoto.addEventListener('click', () => {
    uploadedImages = [];
    currentImageSrc = null;
    fileInput.value = '';
    previewImage.src = '';
    dropzone.style.display = 'block';
    previewContainer.style.display = 'none';
    previewActions.style.display = 'none';
    progressBox.style.display = 'none';
    renderGalleryStrip();
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const base64 = dataUrl.split(',')[1];
    uploadedImages.push({
      id: 'img_' + Date.now(),
      name: `Kamera (${uploadedImages.length + 1})`,
      src: dataUrl,
      base64
    });

    dropzone.style.display = 'none';
    previewContainer.style.display = 'flex';
    previewActions.style.display = 'flex';
    setActiveImage(uploadedImages.length - 1);
    renderGalleryStrip();
    showToast('Foto berhasil dijepret & ditambahkan ke antrean!', 'success');
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

  function calc_net(brt, gl, ket) {
    if (brt === null || brt === undefined || String(brt).trim() === '') return '';
    const b = parseFloat(brt);
    if (isNaN(b)) return 0;

    // 1. Explicit minus deduction written in KET column (e.g. "-2", "-3", "- 2", "- 3", "-4", "-5")
    if (ket !== null && ket !== undefined) {
      const ketStr = String(ket).trim();
      const minusMatch = ketStr.match(/^-\s*(\d+(\.\d+)?)$/);
      if (minusMatch) {
        const deduction = parseFloat(minusMatch[1]);
        if (!isNaN(deduction)) {
          return b - deduction;
        }
      }
    }

    // 2. GL Deduction (BRT - 2)
    const glStr = String(gl || '').trim().toLowerCase();
    if (glStr === 'gl' || glStr === 'g') {
      return b - 2;
    }

    // 3. Default standard weight tier deductions
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

    // Active review row highlight
    tableBody.querySelectorAll('tr[data-idx]').forEach(tr => {
      tr.addEventListener('click', () => {
        tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('active-review-row'));
        tr.classList.add('active-review-row');
      });
    });

    // Inline input events
    tableBody.querySelectorAll('input.grid-input').forEach(input => {
      input.addEventListener('input', () => {
        const tr = input.closest('tr');
        const idx = parseInt(tr.getAttribute('data-idx'), 10);
        const field = input.getAttribute('data-field');
        if (tobaccoData[idx]) {
          let val = input.value;

          // If user wrote GL / G or GT in the nama column
          if (field === 'nama') {
            const vTrim = val.trim();
            if (vTrim.toLowerCase() === 'gl' || vTrim.toLowerCase() === 'g') {
              tobaccoData[idx].gl = 'gl';
              tobaccoData[idx].nama = '';
              input.value = '';
              const glInput = tr.querySelector('input[data-field="gl"]');
              if (glInput) glInput.value = 'gl';
            } else if (/^gl\s+/i.test(vTrim)) {
              tobaccoData[idx].gl = 'gl';
              tobaccoData[idx].nama = vTrim.replace(/^gl\s+/i, '').trim();
              input.value = tobaccoData[idx].nama;
              const glInput = tr.querySelector('input[data-field="gl"]');
              if (glInput) glInput.value = 'gl';
            } else if (vTrim.toUpperCase() === 'GT') {
              tobaccoData[idx].gt = 'GT';
              tobaccoData[idx].nama = '';
              input.value = '';
              const gtInput = tr.querySelector('input[data-field="gt"]');
              if (gtInput) gtInput.value = 'GT';
            } else {
              tobaccoData[idx].nama = val;
            }
          } else {
            tobaccoData[idx][field] = val;
          }

          const r = tobaccoData[idx];
          r.brt = calc_brt(r.kg, r.brt_fix);
          r.net = calc_net(r.brt, r.gl, r.ket);
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
      r.net = calc_net(r.brt, r.gl, r.ket);
      r.harga = calc_harga(r.grade);
    });
    renderGridTable();
    showToast('Rumus BRT, NET & HARGA berhasil dihitung ulang!', 'success');
  });

  // =========================================================================
  // =========================================================================
  // Vision AI Execution Engine (Single & Multi-Photo Batch)
  // =========================================================================
  async function executeVisionApiCall(base64Data, apiKey, model) {
    const prompt = `Anda adalah sistem Vision AI OCR cerdas khusus membaca Buku Sortir Tembakau (catatan tulisan tangan pulpen & formulir gudang tembakau).
Tugas Anda: Ekstrak seluruh baris data pada foto kertas berkas ini ke dalam format JSON Array murni.

ATURAN STRUKTUR KOLOM & POLA TULISAN TANGAN:
1. "no": Nomor urut baris (misal: 121, 122, 123, 125, 130, 138, 142, 148, 185...).
2. "nama": 
   - Berisi nama petani/penjual (misal: "H. HANAN", "AMIR", "H. MAHFUD", "Bahrudin", "KURDI", "BRUDIN"), tanggal (misal: "13/8/26", "(10/8/26)", "(9/8 26)"), atau alamat (misal: "KADUR").
   - PENTING ATURAN NOTA & NOMOR LOT HARIAN:
     * Garis horizontal merah atau spasi pada berkas adalah PEMBATAS antar nota pembelian.
     * Jika di samping atau di bawah nama petani ada angka dalam kurung atau angka urutan nota seperti "(2)", "2", "(1)", "(3)", gabungkan ke dalam nama petani tersebut (misal: "BRUDIN (2)" atau "H. MAHFUD").
     * JANGAN memisahkan angka "(2)" atau "2" menjadi nama petani tersendiri di baris baru!
3. "gl" (TEMBAKAU GL) - SANGAT PENTING:
   - Di formulir fisik, tulisan "GL" (atau "gl" atau "Gl" atau "G") SERING SEKALI DITULIS LANGSUNG DI DALAM KOLOM NAMA pada baris-baris tembakau (seperti baris 127..129, 132..137, 140..141, 143..147, 150)!
   - ATAU tulisan "GL" / "G" ditulis di margin sebelah kiri luar nomor baris (di samping No. 125, 130, 138, 142, 148).
   - ATURAN DETEKSI GL:
     * Jika di kolom nama atau margin tertulis "GL" / "gl" / "G", baris tersebut WAJIB diisi "gl": "gl".
     * Kolom "nama" baris tersebut dikosongkan "" (JANGAN tulis "GL" sebagai nama orang!).
     * JIKA satu kelompok nota (antara 2 garis merah) ditandai GL di margin atau di baris-barisnya, maka SEMUA baris di kelompok tersebut berjenis "gl": "gl"!
4. "gt" (TEMBAKAU GT) - SANGAT PENTING:
   - Tulisan "GT" (atau "gt") di kolom nama (seperti baris 123, 124) menandakan tembakau GT:
     * Baris tersebut WAJIB diisi "gt": "GT" dan "gl": "".
     * Kolom "nama" baris tersebut dikosongkan "".
5. "grade": Angka grade tembakau (misal: 68, 65, 62, 60, 57, 55, 52, 48, 45, 41, 40, 37, 32, dll).
6. "kg": 
   - Berat timbangan kotor WAJIB DITULIS LENGKAP DENGAN PECAHAN DESIMALNYA!
   - Contoh: "47.5", "46.5", "45.4", "44.9", "40.4", "30.5", "38.5", "47.0", "45.9", "45.9", "42.4", "40.1", "41.1", "48.8", "50.3", "49.2", "51.2", "38.3", "41.7", "49.8", "50.4", "46.6", "48.1", "31.5", "45.6", "40.7".
   - JANGAN dibulatkan dan JANGAN dihilangkan angka di belakang komanya!
7. "brt_fix": 
   - Kolom persis SETELAH kolom KG (pada tabel tercetak sebagai kolom KET atau BRT).
   - ATURAN MUTLAK:
     * JIKA kolom KET/BRT pada kertas TERISI angka tulisan tangan (misal: 47, 46, 44, 39, 30, 38, 46, 45, 44, 41, 39, 40, 27, 28, 48, 50, 48, 50, 37, 41, 49, 46, 47, 30, 45, 39...), maka masukkan angka tersebut ke "brt_fix".
     * JIKA kolom BRT pada kertas KOSONG, maka KOSONGKAN "brt_fix": "" (sistem akan menghitung otomatis).
8. "ket": 
   - Kolom catatan khusus setelah kolom BRT FIX.
   - PENTING ATURAN POTONGAN NETTO (misal "- 2", "- 3", "-2", "-3"):
     * Pada berkas fisik (seperti berkas KURDI baris 185-199), angka setelah BRT FIX berisi catatan potongan netto seperti "- 2", "- 3", "-2", "-3".
     * WAJIB dimasukkan ke "ket": "- 2" atau "ket": "- 3".
     * Sistem otomatis menghitung NETTO = BRT - 2 atau BRT - 3 sesuai catatan ini.
   - Catatan lain seperti "BS", "BS - 20", "ada bs" tetap dimasukkan ke "ket".
9. "BS" (BARANG SORTIR / TEMBAKAU BS):
   - Sering tertulis di baris paling bawah, di luar tabel, atau pada baris khusus (misal: "(BAHRUDIN) BS - 20  66.2  64" atau "(BAHRUDIN) BS - 20 (10/8 26)  66.2  64").
   - ATURAN MUTLAK BS:
     * Angka setelah tulisan BS adalah GRADE-nya! (misal "BS - 20" -> "grade": "20", "BS-25" -> "grade": "25", "BS 18" -> "grade": "18").
     * "ket": diisi "BS" atau "BS - 20".
     * "nama": diisi nama yang tertulis di sampingnya (misal "BAHRUDIN").
     * "kg": diisi berat desimalnya (misal "66.2").
     * "brt_fix": diisi berat bulatnya jika ada (misal "64").
     * "no": diisi nomor urut setelah baris sebelumnya.

PENTING:
- Pastikan angka desimal KG terbaca sangat teliti (.0, .1, .2, .3, .4, .5, .6, .7, .8, .9).
- Kembalikan HANYA format JSON valid tanpa kata pengantar apa pun, seperti:
[
  {"no": 148, "gl": "gl", "gt": "", "nama": "H. HANAN", "grade": "55", "kg": "31.5", "brt_fix": "30", "ket": ""},
  {"no": 149, "gl": "gl", "gt": "", "nama": "(10/8/26)", "grade": "63", "kg": "45.6", "brt_fix": "45", "ket": ""},
  {"no": 150, "gl": "gl", "gt": "", "nama": "", "grade": "63", "kg": "40.7", "brt_fix": "39", "ket": ""},
  {"no": 151, "gl": "", "gt": "", "nama": "BAHRUDIN", "grade": "20", "kg": "66.2", "brt_fix": "64", "ket": "BS - 20"}
]`;

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

    let response = null;
    let lastError = null;

    for (let i = 0; i < modelCandidates.length; i++) {
      const candidate = modelCandidates[i];
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });

        if (res.ok) {
          response = res;
          localStorage.setItem(MODEL_STORAGE, candidate);
          break;
        }

        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `HTTP ${res.status}`;
        lastError = new Error(errMsg);

        if (res.status === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not supported')) {
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

    if (!response) {
      throw lastError || new Error('Gagal menghubungi Gemini Vision API.');
    }

    const data = await response.json();
    let textOut = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    textOut = textOut.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();

    let parsedRows = [];
    try {
      parsedRows = JSON.parse(textOut);
    } catch (parseErr) {
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

    return Array.isArray(parsedRows) ? parsedRows : [];
  }

  btnRunVisionAI.addEventListener('click', async () => {
    const imagesToScan = uploadedImages.length > 0 
      ? uploadedImages 
      : (currentImageSrc ? [{ id: 'single', name: 'Foto Berkas', src: currentImageSrc, base64: currentImageSrc.split(',')[1] }] : []);

    if (imagesToScan.length === 0) {
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

    try {
      const model = getSavedModel();
      let allExtractedRows = [];
      const totalImages = imagesToScan.length;

      for (let i = 0; i < totalImages; i++) {
        const currentImg = imagesToScan[i];
        const progressPct = Math.round(((i + 0.3) / totalImages) * 90);
        progressBarFill.style.width = `${progressPct}%`;
        progressStatus.textContent = totalImages > 1 
          ? `Membaca Foto ${i + 1} dari ${totalImages} (${currentImg.name})...` 
          : `Vision AI sedang membaca tulisan tangan berkas...`;
        progressSub.textContent = `Mengekstrak baris NO, NAMA, GRADE, KG, BRT, & BS`;

        setActiveImage(i);
        const rows = await executeVisionApiCall(currentImg.base64, apiKey, model);
        allExtractedRows = [...allExtractedRows, ...rows];
      }

      progressBarFill.style.width = '95%';
      progressStatus.textContent = 'Menghitung rumus otomatis...';

      if (allExtractedRows.length > 0) {
        // Pass 1: Normalize row values and detect GL / GT
        const mappedRows = allExtractedRows.map((r, i) => {
          const noVal = r.no ? Number(r.no) : (i + 1);

          let glVal = String(r.gl || '').trim().toLowerCase();
          let gtVal = String(r.gt || '').trim().toUpperCase();
          let namaVal = String(r.nama || '').trim();

          // Handle when GL / G or GT was written in the NAMA column
          if (namaVal.toLowerCase() === 'gl' || namaVal.toLowerCase() === 'g' || /^gl\b/i.test(namaVal) || /^g\s+[a-z]/i.test(namaVal)) {
            glVal = 'gl';
            namaVal = namaVal.replace(/^gl\s*/i, '').replace(/^g\s+/i, '').trim();
            if (namaVal.toLowerCase() === 'g') namaVal = '';
          }
          if (namaVal.toUpperCase() === 'GT' || /^gt\b/i.test(namaVal)) {
            gtVal = 'GT';
            namaVal = namaVal.replace(/^gt\s*/i, '').trim();
          }

          if (glVal.includes('gl') || glVal === 'g') glVal = 'gl';
          else glVal = '';
          if (gtVal.includes('GT') || gtVal === 'GT') gtVal = 'GT';
          else gtVal = '';

          const brtVal = calc_brt(r.kg, r.brt_fix);

          return {
            no: noVal,
            gl: glVal,
            gt: gtVal,
            nama: namaVal,
            grade: r.grade ? String(r.grade) : '',
            harga: 0,
            kg: r.kg ? String(r.kg) : '',
            brt: brtVal,
            brt_fix: r.brt_fix ? String(r.brt_fix) : '',
            net: 0,
            ket: r.ket || ''
          };
        });

        // Pass 2: Lot GL Inheritance (propagate GL to all rows within a farmer's lot)
        // A farmer's lot spans from one header name until the next header name
        let currentLotHasGl = false;
        let lotStartIdx = 0;

        for (let i = 0; i <= mappedRows.length; i++) {
          const isEnd = (i === mappedRows.length);
          const isNewHeader = !isEnd && isHeaderNameToken(mappedRows[i].nama);

          if (isNewHeader || isEnd) {
            if (i > lotStartIdx) {
              // Check if any row in this lot had GL marker
              let lotGl = false;
              for (let j = lotStartIdx; j < i; j++) {
                if (mappedRows[j].gl === 'gl') {
                  lotGl = true;
                  break;
                }
              }
              // If lot has GL, set all rows (unless explicitly GT or BS) to GL
              if (lotGl) {
                for (let j = lotStartIdx; j < i; j++) {
                  if (mappedRows[j].gt !== 'GT' && !isBsRow(mappedRows[j])) {
                    mappedRows[j].gl = 'gl';
                  }
                }
              }
            }
            lotStartIdx = i;
          }
        }

        // Final Pass: calculate NET and HARGA for all rows
        tobaccoData = mappedRows.map(r => {
          const hrgVal = calc_harga(r.grade);
          const netVal = calc_net(r.brt, r.gl, r.ket);
          r.harga = hrgVal;
          r.net = netVal;
          return r;
        });

        renderGridTable();
        showToast(`Vision AI berhasil mengekstrak total ${tobaccoData.length} baris dari ${totalImages} foto berkas!`, 'success', 5000);
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

  // =========================================================================
  // BS Identification & Farmer Association Helpers
  // =========================================================================
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

    // 'ada bs' in KET is a marker for companion side BS, not a BS row by itself
    if (ket === 'ada bs') return false;
    if (no === 'bs' || no.startsWith('bs')) return true;
    if (ket.includes('bs')) return true;
    if (nama.startsWith('bs') || (nama.includes('bs') && !nama.includes('bahruddin') && !nama.includes('basri') && !nama.includes('subaidi'))) return true;
    if (gl === 'bs') return true;
    return false;
  }

  function getFarmerNameForRow(rowIndex) {
    if (rowIndex < 0 || rowIndex >= tobaccoData.length) return '';
    const r = tobaccoData[rowIndex];

    const selfName = String(r.nama || '').trim();
    if (selfName && isHeaderNameToken(selfName)) {
      return selfName.replace(/[()0-9]/g, '').trim();
    }

    // Look upwards for the closest farmer name above this row
    for (let j = rowIndex - 1; j >= 0; j--) {
      const prevName = String(tobaccoData[j].nama || '').trim();
      if (prevName && isHeaderNameToken(prevName)) {
        return prevName.replace(/[()0-9]/g, '').trim();
      }
    }
    return '';
  }

  function getSelectedNotaRows() {
    if (tobaccoData.length === 0) return { rows: [], from: null, to: null, label: 'Kosong' };

    const fromVal = inputNotaFrom ? parseInt(inputNotaFrom.value.trim(), 10) : NaN;
    const toVal = inputNotaTo ? parseInt(inputNotaTo.value.trim(), 10) : NaN;

    const mainRows = [];
    const bsRows = [];

    if (!isNaN(fromVal) && !isNaN(toVal)) {
      const minNo = Math.min(fromVal, toVal);
      const maxNo = Math.max(fromVal, toVal);

      const rangeIndices = [];
      tobaccoData.forEach((r, idx) => {
        const n = parseInt(r.no, 10);
        if (!isNaN(n) && n >= minNo && n <= maxNo) {
          rangeIndices.push(idx);
        }
      });

      const tempRows = rangeIndices.map(i => tobaccoData[i]);
      const rangeInfo = detectInfo(tempRows, minNo);
      const farmerName = (rangeInfo.nama || '').replace(/[()0-9]/g, '').trim().toLowerCase();

      const includedIndices = new Set();

      rangeIndices.forEach(idx => {
        const r = tobaccoData[idx];
        includedIndices.add(idx);

        if (isBsRow(r)) {
          bsRows.push({
            no: r.no,
            gl: '',
            gt: '',
            nama: r.nama || '',
            grade: r.grade,
            brt: r.brt,
            net: r.net,
            harga: r.harga,
            bs: true,
            label: 'BS'
          });
        } else {
          mainRows.push(r);
          if (r.bs_info) {
            bsRows.push({
              no: r.no,
              gl: '',
              gt: '',
              nama: '',
              grade: r.bs_info.grade,
              brt: r.bs_info.brt,
              net: r.bs_info.net,
              harga: r.bs_info.harga,
              bs: true,
              label: 'BS'
            });
          }
        }
      });

      // Bundle any separate BS row whose associated farmer matches this range
      tobaccoData.forEach((r, idx) => {
        if (includedIndices.has(idx)) return;
        if (!isBsRow(r)) return;

        const rFarmer = getFarmerNameForRow(idx).replace(/[()0-9]/g, '').trim().toLowerCase();
        const rSelfName = String(r.nama || '').replace(/[()0-9]/g, '').trim().toLowerCase();

        const matches = (farmerName && rFarmer && (rFarmer.includes(farmerName) || farmerName.includes(rFarmer))) ||
                        (farmerName && rSelfName && (rSelfName.includes(farmerName) || farmerName.includes(rSelfName)));

        if (matches) {
          bsRows.push({
            no: r.no,
            gl: '',
            gt: '',
            nama: r.nama || '',
            grade: r.grade,
            brt: r.brt,
            net: r.net,
            harga: r.harga,
            bs: true,
            label: 'BS'
          });
        }
      });

      const label = `No. ${minNo} s/d ${maxNo}`;
      return { rows: [...mainRows, ...bsRows], from: minNo, to: maxNo, label };
    } else if (!isNaN(fromVal)) {
      tobaccoData.forEach((r, idx) => {
        const n = parseInt(r.no, 10);
        if (isNaN(n) || n >= fromVal) {
          if (isBsRow(r)) {
            bsRows.push({
              no: r.no,
              gl: '',
              gt: '',
              nama: r.nama || '',
              grade: r.grade,
              brt: r.brt,
              net: r.net,
              harga: r.harga,
              bs: true,
              label: 'BS'
            });
          } else {
            mainRows.push(r);
            if (r.bs_info) {
              bsRows.push({
                no: r.no,
                gl: '',
                gt: '',
                nama: '',
                grade: r.bs_info.grade,
                brt: r.bs_info.brt,
                net: r.bs_info.net,
                harga: r.bs_info.harga,
                bs: true,
                label: 'BS'
              });
            }
          }
        }
      });
      return { rows: [...mainRows, ...bsRows], from: fromVal, to: null, label: `Mulai No. ${fromVal}` };
    } else if (!isNaN(toVal)) {
      tobaccoData.forEach((r, idx) => {
        const n = parseInt(r.no, 10);
        if (isNaN(n) || n <= toVal) {
          if (isBsRow(r)) {
            bsRows.push({
              no: r.no,
              gl: '',
              gt: '',
              nama: r.nama || '',
              grade: r.grade,
              brt: r.brt,
              net: r.net,
              harga: r.harga,
              bs: true,
              label: 'BS'
            });
          } else {
            mainRows.push(r);
            if (r.bs_info) {
              bsRows.push({
                no: r.no,
                gl: '',
                gt: '',
                nama: '',
                grade: r.bs_info.grade,
                brt: r.bs_info.brt,
                net: r.bs_info.net,
                harga: r.bs_info.harga,
                bs: true,
                label: 'BS'
              });
            }
          }
        }
      });
      return { rows: [...mainRows, ...bsRows], from: null, to: toVal, label: `Sampai No. ${toVal}` };
    }

    // Default: all rows
    tobaccoData.forEach(r => {
      if (isBsRow(r)) {
        bsRows.push({
          no: r.no,
          gl: '',
          gt: '',
          nama: r.nama || '',
          grade: r.grade,
          brt: r.brt,
          net: r.net,
          harga: r.harga,
          bs: true,
          label: 'BS'
        });
      } else {
        mainRows.push(r);
        if (r.bs_info) {
          bsRows.push({
            no: r.no,
            gl: '',
            gt: '',
            nama: '',
            grade: r.bs_info.grade,
            brt: r.bs_info.brt,
            net: r.bs_info.net,
            harga: r.bs_info.harga,
            bs: true,
            label: 'BS'
          });
        }
      }
    });

    return { rows: [...mainRows, ...bsRows], from: null, to: null, label: 'Semua Baris' };
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
      if (r.bs || isBsRow(r)) return; // Skip all companion and standalone BS rows
      const v = String(r.nama || '').trim();
      if (v && !['gl', 'gt'].includes(v.toLowerCase()) && !v.toLowerCase().startsWith('bs')) {
        items.push({ no: r.no, text: v, isDate: isDateToken(v), isLotIndex: isLotIndexToken(v) });
      }
    });

    const dateIdx = items.findIndex(item => item.isDate);
    let nama = '';
    let tanggal = '';
    let alamat = '';

    if (dateIdx !== -1) {
      tanggal = formatIndoDate(items[dateIdx].text);

      const beforeDate = items.slice(0, dateIdx).filter(it => !it.isDate);
      if (beforeDate.length > 0) {
        const nameParts = [];
        beforeDate.forEach(it => {
          if (it.isLotIndex) {
            const num = it.text.replace(/[()\-]/g, '').trim();
            if (num) nameParts.push(`(${num})`);
          } else {
            nameParts.push(it.text);
          }
        });
        nama = nameParts.join(' ').replace(/\s+/g, ' ').trim();
      }

      for (let i = dateIdx + 1; i < items.length; i++) {
        if (!items[i].isDate && !items[i].isLotIndex && items[i].text) {
          alamat = items[i].text;
          break;
        }
      }
    } else {
      const nonDate = items.filter(it => !it.isDate);
      if (nonDate.length > 0) {
        if (nonDate.length > 1 && nonDate[1].isLotIndex) {
          const num = nonDate[1].text.replace(/[()\-]/g, '').trim();
          nama = `${nonDate[0].text} (${num})`;
        } else {
          nama = nonDate[0].text;
          if (nonDate.length > 1 && !nonDate[1].isLotIndex) alamat = nonDate[1].text;
        }
      }
    }

    if (!nama && startNo !== null && tobaccoData.length > 0) {
      const allBefore = tobaccoData.filter(r => parseInt(r.no, 10) < startNo);
      for (let i = allBefore.length - 1; i >= 0; i--) {
        if (isBsRow(allBefore[i])) continue;
        const v = String(allBefore[i].nama || '').trim();
        if (v && isHeaderNameToken(v)) {
          nama = v;
          if (i + 1 < allBefore.length && isLotIndexToken(allBefore[i + 1].nama)) {
            const num = String(allBefore[i + 1].nama).replace(/[()\-]/g, '').trim();
            if (num && !nama.includes(`(${num})`)) nama += ` (${num})`;
          }
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

      if (!r.bs && !isBsRow(r) && (String(r.gt || '').toUpperCase().trim() === 'GT' || String(r.ket || '').toUpperCase().includes('GT'))) {
        gtCount++;
      }
    });

    const info = detectInfo(rows, startNo);
    const autoNama = info.nama;
    const autoTanggal = info.tanggal;
    const autoAlamat = info.alamat;

    const pphVal = Math.ceil((sumJumlah * 0.01) / 5000) * 5000;
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

    // Detect clusters / batches based on filled farmer names (respecting lot indices like (2))
    const batches = [];
    let currentBatch = null;

    tobaccoData.forEach(r => {
      const num = parseInt(r.no, 10);
      const name = String(r.nama || '').trim();
      const isBs = isBsRow(r);
      const isHeaderName = !isBs && isHeaderNameToken(name);

      if (isHeaderName) {
        if (currentBatch && currentBatch.items.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = {
          name: name,
          startNo: !isNaN(num) ? num : (currentBatch ? currentBatch.endNo + 1 : 1),
          endNo: !isNaN(num) ? num : (currentBatch ? currentBatch.endNo + 1 : 1),
          items: [r]
        };
      } else if (currentBatch) {
        if (isLotIndexToken(name) && !currentBatch.name.includes('(')) {
          const numStr = name.replace(/[()\-]/g, '').trim();
          if (numStr) currentBatch.name += ` (${numStr})`;
        }
        if (!isBs && !isNaN(num)) {
          currentBatch.endNo = num;
        }
        currentBatch.items.push(r);
      } else {
        currentBatch = {
          name: 'Kelompok 1',
          startNo: !isNaN(num) ? num : 1,
          endNo: !isNaN(num) ? num : 1,
          items: [r]
        };
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
      const labelName = b.name.length > 14 ? b.name.substring(0, 12) + '..' : b.name;
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

  btnGenerateNota.addEventListener('click', async () => {
    if (tobaccoData.length === 0) {
      showToast('Tidak ada data untuk membuat Nota Pembelian', 'error');
      return;
    }

    const { rows: filteredRows, from: startNo, to: endNo, label } = getSelectedNotaRows();

    if (filteredRows.length === 0) {
      showToast(`Tidak ada data baris pada rentang ${label}`, 'error');
      return;
    }

    const info = detectInfo(filteredRows, startNo);
    const finalNama = (inputNotaNama && inputNotaNama.value.trim()) || info.nama || 'Nama Penjual';
    const finalTanggal = (inputNotaTanggal && inputNotaTanggal.value.trim()) || info.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const finalAlamat = (inputNotaAlamat && inputNotaAlamat.value.trim()) || info.alamat || 'Pegantenan';

    const rangeTag = startNo && endNo ? `${startNo}-${endNo}` : (startNo ? `Mulai-${startNo}` : 'Lengkap');
    const safeName = finalNama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Nota_${safeName}_${rangeTag}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    try {
      if (typeof ExcelJS !== 'undefined') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Vision AI Nota Generator';
        const sheetTitle = (finalNama || `Nota ${rangeTag}`).replace(/[\/\\?*\[\]:]/g, '-').slice(0, 31);
        const ws = workbook.addWorksheet(sheetTitle, {
          views: [{ showGridLines: false }],
          pageSetup: {
            paperSize: 9, // A4
            orientation: 'portrait',
            horizontalDpi: 300,
            verticalDpi: 300,
            margins: { left: 1.0, right: 1.0, top: 1.0, bottom: 1.0, header: 0.5, footer: 0.5 }
          }
        });

        // Set generous column widths so numbers never show #####
        ws.columns = [
          { width: 14 }, // No. GUD
          { width: 12 }, // BRUTO
          { width: 12 }, // NETTO
          { width: 16 }, // HARGA
          { width: 24 }  // JUMLAH (Wide enough for large 8-figure numbers and Rp format)
        ];

        // Row Heights
        ws.getRow(2).height = 24;
        ws.getRow(4).height = 17;
        ws.getRow(5).height = 17;
        ws.getRow(6).height = 17;
        ws.getRow(8).height = 20;

        // Embed Tobacco Leaf Logo in cell A2 (compact, square & proportional 48x48px)
        const b64Data = (typeof window !== 'undefined' && window.TOBACCO_LOGO_BASE64) ? window.TOBACCO_LOGO_BASE64 : null;
        if (b64Data) {
          try {
            const logoId = workbook.addImage({
              base64: b64Data,
              extension: 'png'
            });
            ws.addImage(logoId, {
              tl: { col: 0.15, row: 1.05 },
              ext: { width: 48, height: 48 },
              editAs: 'oneCell'
            });
          } catch (imgErr) {
            console.warn('[Nota] ExcelJS Logo Base64 error:', imgErr);
          }
        } else {
          try {
            const logoRes = await fetch('logo.png');
            if (logoRes.ok) {
              const logoBuffer = await logoRes.arrayBuffer();
              const logoId = workbook.addImage({
                buffer: logoBuffer,
                extension: 'png'
              });
              ws.addImage(logoId, {
                tl: { col: 0.15, row: 1.05 },
                ext: { width: 48, height: 48 },
                editAs: 'oneCell'
              });
            }
          } catch (imgErr) {
            console.warn('[Nota] Logo image fetch skipped:', imgErr);
          }
        }

        // Title in B2
        const titleCell = ws.getCell('B2');
        titleCell.value = 'NOTA PEMBELIAN TEMBAKAU 2026';
        titleCell.font = { name: 'Bahnschrift', size: 16, bold: true };
        titleCell.alignment = { vertical: 'middle' };

        // Identity in A4..B6
        const setIdentity = (row, label, val) => {
          const cLabel = ws.getCell(`A${row}`);
          cLabel.value = label;
          cLabel.font = { name: 'Bahnschrift', size: 11, bold: true };
          cLabel.alignment = { horizontal: 'right', vertical: 'middle' };

          const cVal = ws.getCell(`B${row}`);
          cVal.value = val;
          cVal.font = { name: 'Bahnschrift', size: 11 };
          cVal.alignment = { horizontal: 'left', vertical: 'middle' };
        };

        setIdentity(4, 'Nama    :', finalNama);
        setIdentity(5, 'Alamat    :', finalAlamat);
        setIdentity(6, 'Tgl/Hr/Thn  :', finalTanggal);

        // Header Table in Row 8 with solid borders
        const headers = ['No. GUD', 'BRUTO', 'NETTO', 'HARGA', 'JUMLAH'];
        const borderMedium = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        };
        const borderThin = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
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

        const pphVal = Math.ceil((sumJumlah * 0.01) / 5000) * 5000;
        const koliVal = filteredRows.length * 5000;
        const gtVal = gtCount * 65000;
        const totalBersih = sumJumlah - pphVal - koliVal - gtVal;

        // Footer Rows Helper
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
        addFooterRow(rPph, 'PPH 1%', `CEILING(E${rJml}*0.01,5000)`, pphVal, '#,##0');
        if (gtCount > 0) {
          addFooterRow(rGt, 'GT', `65000*COUNTIF(A${dataStart}:A${dataEnd},"GT*")`, gtVal, '"Rp"#,##0');
        }
        addFooterRow(rKoli, 'Koli', `COUNTA(A${dataStart}:A${dataEnd})*5000`, koliVal, '"Rp"#,##0');

        const totFormula = gtCount > 0
          ? `E${rJml}-E${rKoli}-E${rGt}-E${rPph}`
          : `E${rJml}-E${rKoli}-E${rPph}`;
        addFooterRow(rTot, 'TOTAL', totFormula, totalBersih, '"Rp"#,##0', true);

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
        showToast(`Nota Pembelian Excel berhasil diunduh (Lengkap Garis & Logo) -> ${filename}`, 'success', 5000);
        return;
      }
    } catch (err) {
      console.warn('[ExcelJS Error, fallback to SheetJS]:', err);
    }

    // Fallback SheetJS exporter if ExcelJS is unavailable
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
    const jumlahRow = dataEndRow + 1;
    const pphRow = jumlahRow + 1;
    const koliRow = pphRow + 1;
    const pphVal = Math.ceil((sumJumlah * 0.01) / 5000) * 5000;
    const koliVal = filteredRows.length * 5000;
    const gtVal = gtCount * 65000;

    wsData.push(['', '', '', 'JUMLAH', { t: 'n', f: `SUM(E${dataStartRow}:E${dataEndRow})`, v: sumJumlah }]);
    wsData.push(['', '', '', 'PPH 1%', { t: 'n', f: `CEILING(E${jumlahRow}*0.01, 5000)`, v: pphVal }]);
    wsData.push(['', '', '', 'Koli', { t: 'n', f: `COUNTA(A${dataStartRow}:A${dataEndRow})*5000`, v: koliVal }]);

    let totalFormula = `E${jumlahRow}-E${pphRow}-E${koliRow}`;
    let totalBersih = sumJumlah - pphVal - koliVal;

    if (gtCount > 0) {
      const gtRow = koliRow + 1;
      wsData.push(['', '', '', 'GT', { t: 'n', f: `COUNTIF(A${dataStartRow}:A${dataEndRow}, "GT*")*65000`, v: gtVal }]);
      totalFormula += `-E${gtRow}`;
      totalBersih -= gtVal;
    }

    wsData.push(['', '', '', 'TOTAL', { t: 'n', f: totalFormula, v: totalBersih }]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 14 }, { wch: 11 }, { wch: 11 }, { wch: 15 }, { wch: 18 }];
    ws['!pageSetup'] = { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    ws['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };

    XLSX.utils.book_append_sheet(wb, ws, `Nota ${rangeTag}`);
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

    const pphVal = Math.ceil((sumJumlah * 0.01) / 5000) * 5000;
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
        <img src="logo.png" alt="Logo Tembakau" class="nota-print-logo" onerror="if(window.TOBACCO_LOGO_BASE64) this.src='data:image/png;base64,'+window.TOBACCO_LOGO_BASE64; else this.style.display='none';" />
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
            <td class="align-right">PPH 1%</td>
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

