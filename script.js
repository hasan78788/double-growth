/**
 * DOUBLE GROWTH APPS - ENGINE
 * GitHub Pages Native Direct Storage + Custom Backend Support
 */

document.addEventListener('DOMContentLoaded', () => {
  const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB

  // Storage Settings State
  let config = {
    mode: localStorage.getItem('DG_MODE') || 'github', // 'github' or 'server'
    ghOwner: localStorage.getItem('DG_GH_OWNER') || 'hasan78788',
    ghRepo: localStorage.getItem('DG_GH_REPO') || 'hasan78788.github.io',
    ghBranch: localStorage.getItem('DG_GH_BRANCH') || 'main',
    ghToken: localStorage.getItem('DG_GH_TOKEN') || '',
    serverUrl: localStorage.getItem('DG_SERVER_URL') || ''
  };

  let selectedFile = null;
  let fileListCache = [];
  let currentFilter = 'ALL';
  let targetDeleteFileName = null;
  let targetDeleteSha = null;

  // DOM Elements
  const serverStatusPill = document.getElementById('serverStatusPill');
  const serverStatusText = document.getElementById('serverStatusText');
  const openSettingsBtn = document.getElementById('openSettingsBtn');

  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  const tabGithub = document.getElementById('tabGithub');
  const tabServer = document.getElementById('tabServer');
  const contentGithub = document.getElementById('contentGithub');
  const contentServer = document.getElementById('contentServer');

  const ghOwnerInput = document.getElementById('ghOwnerInput');
  const ghRepoInput = document.getElementById('ghRepoInput');
  const ghBranchInput = document.getElementById('ghBranchInput');
  const ghTokenInput = document.getElementById('ghTokenInput');
  const serverUrlInput = document.getElementById('serverUrlInput');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const selectedFilePanel = document.getElementById('selectedFilePanel');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');

  const previewName = document.getElementById('previewName');
  const previewSize = document.getElementById('previewSize');
  const previewType = document.getElementById('previewType');
  const previewIcon = document.getElementById('previewIcon');

  const progressContainer = document.getElementById('progressContainer');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressBytes = document.getElementById('progressBytes');
  const progressSpeed = document.getElementById('progressSpeed');

  const uploadBoxCard = document.getElementById('uploadBoxCard');
  const successCard = document.getElementById('successCard');
  const successName = document.getElementById('successName');
  const successSize = document.getElementById('successSize');
  const successType = document.getElementById('successType');
  const successDate = document.getElementById('successDate');
  const successUrlInput = document.getElementById('successUrlInput');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const openUrlBtn = document.getElementById('openUrlBtn');
  const downloadUrlBtn = document.getElementById('downloadUrlBtn');
  const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');

  const alertBanner = document.getElementById('alertBanner');
  const alertTitle = document.getElementById('alertTitle');
  const alertMessage = document.getElementById('alertMessage');
  const alertCloseBtn = document.getElementById('alertCloseBtn');
  const toast = document.getElementById('toast');

  const filesTableBody = document.getElementById('filesTableBody');
  const searchInput = document.getElementById('searchInput');
  const filterPills = document.getElementById('filterPills');
  const refreshFilesBtn = document.getElementById('refreshFilesBtn');

  const deleteModal = document.getElementById('deleteModal');
  const deleteTargetName = document.getElementById('deleteTargetName');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Utility Functions
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(fileName) {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (['apk', 'xapk', 'apks'].includes(ext)) return '📦';
    if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)) return '🎬';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return '🖼️';
    if (['mp3', 'wav', 'm4a', 'flac'].includes(ext)) return '🎵';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'html', 'csv', 'json'].includes(ext)) return '📄';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗂️';
    return '📁';
  }

  function showAlert(title, message) {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertBanner.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideAlert() {
    alertBanner.classList.add('hidden');
  }

  if (alertCloseBtn) alertCloseBtn.addEventListener('click', hideAlert);

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  // STORAGE HEALTH CHECK
  async function checkStorageHealth() {
    if (config.mode === 'github') {
      if (!config.ghOwner || !config.ghRepo) {
        setConnectedStatus(false, 'Storage Not Connected');
        return false;
      }

      try {
        const headers = config.ghToken ? { 'Authorization': `token ${config.ghToken}` } : {};
        const res = await fetch(`https://api.github.com/repos/${config.ghOwner}/${config.ghRepo}`, { headers });

        if (res.ok) {
          setConnectedStatus(true, 'Storage Connected (GitHub API)');
          return true;
        }
      } catch (err) {}

      setConnectedStatus(false, 'Storage Not Connected');
      return false;
    } else {
      if (!config.serverUrl) {
        setConnectedStatus(false, 'Storage Not Connected');
        return false;
      }

      try {
        const res = await fetch(`${config.serverUrl.replace(/\/$/, '')}/api/health`);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) {}

        if (res.ok && data && data.status === 'ok') {
          setConnectedStatus(true, 'Storage Connected');
          return true;
        }
      } catch (err) {}

      setConnectedStatus(false, 'Storage Not Connected');
      return false;
    }
  }

  function setConnectedStatus(connected, text) {
    if (connected) {
      serverStatusPill.className = 'status-pill connected';
      serverStatusText.textContent = text;
    } else {
      serverStatusPill.className = 'status-pill disconnected';
      serverStatusText.textContent = text;
    }
  }

  // SETTINGS MODAL HANDLERS
  openSettingsBtn.addEventListener('click', () => {
    ghOwnerInput.value = config.ghOwner;
    ghRepoInput.value = config.ghRepo;
    ghBranchInput.value = config.ghBranch;
    ghTokenInput.value = config.ghToken;
    serverUrlInput.value = config.serverUrl;

    if (config.mode === 'github') switchTab('github');
    else switchTab('server');

    settingsModal.classList.remove('hidden');
  });

  function switchTab(mode) {
    config.mode = mode;
    if (mode === 'github') {
      tabGithub.classList.add('active');
      tabServer.classList.remove('active');
      contentGithub.classList.remove('hidden');
      contentServer.classList.add('hidden');
    } else {
      tabServer.classList.add('active');
      tabGithub.classList.remove('active');
      contentServer.classList.remove('hidden');
      contentGithub.classList.add('hidden');
    }
  }

  tabGithub.addEventListener('click', () => switchTab('github'));
  tabServer.addEventListener('click', () => switchTab('server'));

  closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

  saveSettingsBtn.addEventListener('click', () => {
    config.ghOwner = ghOwnerInput.value.trim();
    config.ghRepo = ghRepoInput.value.trim();
    config.ghBranch = ghBranchInput.value.trim() || 'main';
    config.ghToken = ghTokenInput.value.trim();
    config.serverUrl = serverUrlInput.value.trim();

    localStorage.setItem('DG_MODE', config.mode);
    localStorage.setItem('DG_GH_OWNER', config.ghOwner);
    localStorage.setItem('DG_GH_REPO', config.ghRepo);
    localStorage.setItem('DG_GH_BRANCH', config.ghBranch);
    localStorage.setItem('DG_GH_TOKEN', config.ghToken);
    localStorage.setItem('DG_SERVER_URL', config.serverUrl);

    settingsModal.classList.add('hidden');
    hideAlert();
    checkStorageHealth();
    fetchFileList();
  });

  // FILE SELECTION
  function handleFileSelect(file) {
    hideAlert();
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showAlert(
        '❌ File Too Large',
        `Maximum allowed size is 300 MB. Selected file: ${formatBytes(file.size)}. Please select a file below 300 MB.`
      );
      resetFileInput();
      return;
    }

    selectedFile = file;
    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);
    previewType.textContent = file.type || 'text/html';
    previewIcon.textContent = getFileIcon(file.name);

    dropzone.classList.add('hidden');
    selectedFilePanel.classList.remove('hidden');
    progressContainer.classList.add('hidden');
    uploadSubmitBtn.disabled = false;
  }

  function resetFileInput() {
    selectedFile = null;
    fileInput.value = '';
    dropzone.classList.remove('hidden');
    selectedFilePanel.classList.add('hidden');
  }

  browseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
  });

  removeFileBtn.addEventListener('click', resetFileInput);

  // UPLOAD DISPATCHER
  uploadSubmitBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      showAlert('❌ File Too Large', 'Maximum allowed size is 300 MB.');
      return;
    }

    uploadSubmitBtn.disabled = true;
    removeFileBtn.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    progressStatusText.textContent = 'Uploading...';
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';

    if (config.mode === 'github') {
      await uploadToGitHub(selectedFile);
    } else {
      await uploadToServer(selectedFile);
    }
  });

  // GITHUB DIRECT REPOSITORY UPLOAD
  async function uploadToGitHub(file) {
    if (!config.ghToken) {
      showAlert('Upload Error', 'GitHub Personal Access Token is required. Click ⚙️ Settings to enter your token.');
      uploadSubmitBtn.disabled = false;
      removeFileBtn.classList.remove('hidden');
      return;
    }

    const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = `${timeStamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadPath = `uploads/${safeName}`;

    try {
      progressPercent.textContent = '30%';
      progressBarFill.style.width = '30%';
      progressStatusText.textContent = 'Encoding file data...';

      const base64Data = await fileToBase64(file);

      progressPercent.textContent = '70%';
      progressBarFill.style.width = '70%';
      progressStatusText.textContent = 'Verifying server storage...';

      const url = `https://api.github.com/repos/${config.ghOwner}/${config.ghRepo}/contents/${uploadPath}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${config.ghToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Upload ${file.name} via Double Growth Apps`,
          content: base64Data,
          branch: config.ghBranch
        })
      });

      const rawText = await res.text();
      let data;
      try { data = JSON.parse(rawText); } catch (e) { data = null; }

      if (res.ok && data && data.content) {
        progressPercent.textContent = '100%';
        progressBarFill.style.width = '100%';
        progressStatusText.textContent = '✓ Upload Complete';

        // Direct HTTPS public link
        const realPublicUrl = `https://${config.ghOwner}.github.io/uploads/${safeName}`;

        const successData = {
          success: true,
          file: { name: file.name, size: file.size, type: file.type || 'text/html' },
          downloadUrl: realPublicUrl,
          message: 'File uploaded successfully'
        };

        setTimeout(() => {
          showSuccessCard(successData);
          fetchFileList();
        }, 300);
      } else {
        const msg = (data && data.message) ? data.message : `GitHub API returned status ${res.status}`;
        showAlert('Upload Error', msg);
        uploadSubmitBtn.disabled = false;
        removeFileBtn.classList.remove('hidden');
      }
    } catch (err) {
      showAlert('Upload Error', 'Network error connecting to GitHub API.');
      uploadSubmitBtn.disabled = false;
      removeFileBtn.classList.remove('hidden');
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Str = reader.result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = error => reject(error);
    });
  }

  // CUSTOM BACKEND SERVER UPLOAD
  function uploadToServer(file) {
    return new Promise((resolve) => {
      if (!config.serverUrl) {
        showAlert('Upload Error', 'Server URL not configured. Click ⚙️ Settings to configure backend.');
        uploadSubmitBtn.disabled = false;
        removeFileBtn.classList.remove('hidden');
        return resolve();
      }

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? e.loaded / elapsed : 0;

          progressBarFill.style.width = percent + '%';
          progressPercent.textContent = percent + '%';
          progressBytes.textContent = `${formatBytes(e.loaded)} / ${formatBytes(e.total)}`;
          progressSpeed.textContent = `${formatBytes(speed)}/s`;

          if (percent === 100) {
            progressStatusText.textContent = 'Verifying server storage...';
          }
        }
      };

      xhr.onload = function () {
        removeFileBtn.classList.remove('hidden');
        const rawText = xhr.responseText || '';
        let data = null;

        try { data = JSON.parse(rawText); } catch (e) {}

        if (xhr.status >= 200 && xhr.status < 300 && data && data.success && data.downloadUrl) {
          progressStatusText.textContent = '✓ Upload Complete';
          setTimeout(() => {
            showSuccessCard(data);
            fetchFileList();
          }, 300);
        } else {
          const msg = (data && data.message) ? data.message : 'Endpoint returned an invalid response.';
          showAlert('Upload Error', msg);
          uploadSubmitBtn.disabled = false;
        }
        resolve();
      };

      xhr.onerror = function () {
        removeFileBtn.classList.remove('hidden');
        uploadSubmitBtn.disabled = false;
        showAlert('Network Failure', 'Unable to reach backend server.');
        resolve();
      };

      xhr.open('POST', `${config.serverUrl.replace(/\/$/, '')}/api/upload`, true);
      xhr.send(formData);
    });
  }

  // DISPLAY SUCCESS CARD
  function showSuccessCard(res) {
    uploadBoxCard.classList.add('hidden');
    successCard.classList.remove('hidden');

    const fileMeta = res.file || {};
    successName.textContent = fileMeta.name || selectedFile.name;
    successSize.textContent = formatBytes(fileMeta.size || selectedFile.size);
    successType.textContent = fileMeta.type || selectedFile.type || 'text/html';
    successDate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    successUrlInput.value = res.downloadUrl;
  }

  // COPY, OPEN, DOWNLOAD
  copyUrlBtn.addEventListener('click', () => {
    const url = successUrlInput.value;
    if (!url) return;

    navigator.clipboard.writeText(url).then(() => {
      showToast('✓ LINK COPIED');
    }).catch(() => {
      successUrlInput.select();
      document.execCommand('copy');
      showToast('✓ LINK COPIED');
    });
  });

  openUrlBtn.addEventListener('click', () => {
    if (successUrlInput.value) window.open(successUrlInput.value, '_blank');
  });

  downloadUrlBtn.addEventListener('click', () => {
    if (successUrlInput.value) {
      const a = document.createElement('a');
      a.href = successUrlInput.value;
      a.download = successName.textContent || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  });

  uploadAnotherBtn.addEventListener('click', () => {
    successCard.classList.add('hidden');
    uploadBoxCard.classList.remove('hidden');
    resetFileInput();
  });

  // FETCH FILE MANAGER LIST
  async function fetchFileList() {
    if (config.mode === 'github') {
      if (!config.ghOwner || !config.ghRepo) {
        filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Configure GitHub settings to view files.</td></tr>`;
        return;
      }

      try {
        const headers = config.ghToken ? { 'Authorization': `token ${config.ghToken}` } : {};
        const res = await fetch(`https://api.github.com/repos/${config.ghOwner}/${config.ghRepo}/contents/uploads`, { headers });
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          fileListCache = data.map(item => ({
            name: item.name,
            size: item.size,
            downloadUrl: `https://${config.ghOwner}.github.io/uploads/${item.name}`,
            sha: item.sha
          }));
          renderFilesTable();
        } else {
          filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No stored files found in uploads/ folder.</td></tr>`;
        }
      } catch (err) {
        filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Unable to fetch uploads list from GitHub.</td></tr>`;
      }
    } else {
      if (!config.serverUrl) {
        filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Configure server settings to view files.</td></tr>`;
        return;
      }

      try {
        const res = await fetch(`${config.serverUrl.replace(/\/$/, '')}/api/files`);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          fileListCache = data;
          renderFilesTable();
        } else {
          filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No stored files retrieved.</td></tr>`;
        }
      } catch (err) {
        filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Server offline or unreachable.</td></tr>`;
      }
    }
  }

  function renderFilesTable() {
    const term = searchInput.value.toLowerCase().trim();

    const filtered = fileListCache.filter(item => {
      const name = (item.fileName || item.name || '').toLowerCase();
      const ext = name.split('.').pop();
      const matchesSearch = name.includes(term) || ext.includes(term);

      if (!matchesSearch) return false;
      if (currentFilter === 'ALL') return true;
      if (currentFilter === 'APK') return ['apk', 'xapk', 'apks'].includes(ext);
      if (currentFilter === 'VIDEO') return ['mp4', 'mov', 'mkv', 'webm'].includes(ext);
      if (currentFilter === 'IMAGE') return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
      if (currentFilter === 'AUDIO') return ['mp3', 'wav', 'm4a'].includes(ext);
      if (currentFilter === 'DOCUMENT') return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'html', 'csv', 'json'].includes(ext);
      if (currentFilter === 'ZIP') return ['zip', 'rar', '7z'].includes(ext);
      return true;
    });

    if (filtered.length === 0) {
      filesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No matching files found.</td></tr>`;
      return;
    }

    filesTableBody.innerHTML = filtered.map(file => {
      const safeName = file.fileName || file.name;
      const icon = getFileIcon(safeName);
      const url = file.downloadUrl || '#';
      const sizeStr = formatBytes(file.fileSize || file.size || 0);
      const dateStr = 'Today';

      return `
        <tr>
          <td>
            <div class="table-file-cell">
              <span>${icon}</span>
              <span>${safeName}</span>
            </div>
          </td>
          <td><span class="badge">${safeName.split('.').pop().toUpperCase()}</span></td>
          <td>${sizeStr}</td>
          <td>${dateStr}</td>
          <td><a href="${url}" target="_blank" style="color:#60a5fa; text-decoration:none;">Direct Link ↗</a></td>
          <td>
            <div class="action-btns-cell">
              <button class="btn btn-secondary sm-btn copy-tbl-btn" data-url="${url}">COPY</button>
              <button class="btn btn-secondary sm-btn open-tbl-btn" data-url="${url}">OPEN</button>
              <button class="btn btn-danger sm-btn del-tbl-btn" data-name="${safeName}" data-sha="${file.sha || ''}">DELETE</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.copy-tbl-btn').forEach(b => {
      b.addEventListener('click', () => {
        navigator.clipboard.writeText(b.dataset.url);
        showToast('✓ LINK COPIED');
      });
    });

    document.querySelectorAll('.open-tbl-btn').forEach(b => {
      b.addEventListener('click', () => window.open(b.dataset.url, '_blank'));
    });

    document.querySelectorAll('.del-tbl-btn').forEach(b => {
      b.addEventListener('click', () => {
        targetDeleteFileName = b.dataset.name;
        targetDeleteSha = b.dataset.sha;
        deleteTargetName.textContent = targetDeleteFileName;
        deleteModal.classList.remove('hidden');
      });
    });
  }

  filterPills.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderFilesTable();
    });
  });

  searchInput.addEventListener('input', renderFilesTable);
  refreshFilesBtn.addEventListener('click', fetchFileList);

  cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    targetDeleteFileName = null;
    targetDeleteSha = null;
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!targetDeleteFileName) return;

    if (config.mode === 'github') {
      try {
        const url = `https://api.github.com/repos/${config.ghOwner}/${config.ghRepo}/contents/uploads/${targetDeleteFileName}`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${config.ghToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Delete ${targetDeleteFileName}`,
            sha: targetDeleteSha,
            branch: config.ghBranch
          })
        });

        if (res.ok) {
          showToast('✓ FILE DELETED');
          deleteModal.classList.add('hidden');
          fetchFileList();
        } else {
          alert('Could not delete file from GitHub repository.');
        }
      } catch (err) {
        alert('Network error while deleting file.');
      }
    } else {
      try {
        const res = await fetch(`${config.serverUrl.replace(/\/$/, '')}/api/files/${encodeURIComponent(targetDeleteFileName)}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          showToast('✓ FILE DELETED');
          deleteModal.classList.add('hidden');
          fetchFileList();
        } else {
          alert('Could not delete file on server.');
        }
      } catch (err) {
        alert('Network failure.');
      }
    }
  });

  // INITIAL RUN
  checkStorageHealth();
  fetchFileList();
});