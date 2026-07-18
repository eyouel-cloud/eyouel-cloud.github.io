const state = {
  mediaType: 'sample',
  mediaUrl: '',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  references: []
};

const DEFAULT_REFERENCES = [
  'https://www.instagram.com/p/CkgR20xjQS4/'
];

const REFERENCE_STORAGE_KEY = 'reel-preview-reference-links';

const refs = {
  mediaInput: document.getElementById('media-input'),
  dropZone: document.getElementById('drop-zone'),
  mediaLayer: document.getElementById('media-layer'),
  sampleArt: document.getElementById('sample-art'),
  username: document.getElementById('username'),
  caption: document.getElementById('caption'),
  likes: document.getElementById('likes'),
  comments: document.getElementById('comments'),
  usernamePreview: document.getElementById('username-preview'),
  captionPreview: document.getElementById('caption-preview'),
  likesPreview: document.getElementById('likes-preview'),
  commentsPreview: document.getElementById('comments-preview'),
  avatarPreview: document.getElementById('avatar-preview'),
  scale: document.getElementById('scale'),
  offsetX: document.getElementById('offset-x'),
  offsetY: document.getElementById('offset-y'),
  scaleOutput: document.getElementById('scale-output'),
  offsetXOutput: document.getElementById('offset-x-output'),
  offsetYOutput: document.getElementById('offset-y-output'),
  safeToggle: document.getElementById('safe-toggle'),
  gridToggle: document.getElementById('grid-toggle'),
  chromeToggle: document.getElementById('chrome-toggle'),
  safeOverlay: document.getElementById('safe-overlay'),
  gridOverlay: document.getElementById('grid-overlay'),
  reelChrome: document.getElementById('reel-chrome'),
  buildButton: document.getElementById('build-button'),
  fitButton: document.getElementById('fit-button'),
  exportButton: document.getElementById('export-button'),
  buildOverlay: document.getElementById('build-overlay'),
  progressValue: document.getElementById('progress-value'),
  progressBar: document.getElementById('progress-bar'),
  fitFromOverlay: document.getElementById('fit-from-overlay'),
  statusPill: document.getElementById('status-pill'),
  canvas: document.getElementById('export-canvas'),
  referenceForm: document.getElementById('reference-form'),
  referenceUrl: document.getElementById('reference-url'),
  referenceList: document.getElementById('reference-list'),
  referenceCount: document.getElementById('reference-count')
};

function updateText() {
  const username = refs.username.value.trim() || 'yourbrand';
  refs.usernamePreview.textContent = '@' + username.replace(/^@/, '');
  refs.avatarPreview.textContent = username.replace(/^@/, '').charAt(0).toUpperCase() || 'Y';
  refs.captionPreview.textContent = refs.caption.value.trim() || 'Caption preview';
  refs.likesPreview.textContent = refs.likes.value.trim() || '0';
  refs.commentsPreview.textContent = refs.comments.value.trim() || '0';
}

function updateTransform() {
  state.scale = Number(refs.scale.value);
  state.offsetX = Number(refs.offsetX.value);
  state.offsetY = Number(refs.offsetY.value);

  refs.mediaLayer.style.setProperty('--media-scale', state.scale);
  refs.mediaLayer.style.setProperty('--media-x', `${state.offsetX}px`);
  refs.mediaLayer.style.setProperty('--media-y', `${state.offsetY}px`);
  refs.scaleOutput.textContent = `${Math.round(state.scale * 100)}%`;
  refs.offsetXOutput.textContent = String(state.offsetX);
  refs.offsetYOutput.textContent = String(state.offsetY);
}

function updateToggles() {
  refs.safeOverlay.classList.toggle('hidden', !refs.safeToggle.checked);
  refs.gridOverlay.classList.toggle('hidden', !refs.gridToggle.checked);
  refs.reelChrome.classList.toggle('hidden', !refs.chromeToggle.checked);
}

function normalizeInstagramUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes('instagram.com')) return '';
    return `https://www.instagram.com${url.pathname.replace(/\/?$/, '/')}`;
  } catch (error) {
    return '';
  }
}

function referenceLabel(url) {
  const match = url.match(/\/(?:p|reel|tv)\/([^/]+)\//);
  return match ? `Reference ${match[1]}` : 'Instagram reference';
}

function saveReferences() {
  localStorage.setItem(REFERENCE_STORAGE_KEY, JSON.stringify(state.references));
}

function loadReferences() {
  try {
    const savedValue = localStorage.getItem(REFERENCE_STORAGE_KEY);
    const saved = savedValue === null ? null : JSON.parse(savedValue);
    state.references = Array.isArray(saved) ? saved : DEFAULT_REFERENCES;
  } catch (error) {
    state.references = DEFAULT_REFERENCES;
  }
}

function renderReferences() {
  refs.referenceList.replaceChildren();
  refs.referenceCount.textContent = `${state.references.length} saved`;

  state.references.forEach((url, index) => {
    const item = document.createElement('article');
    item.className = 'reference-item';

    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = referenceLabel(url);
    const linkText = document.createElement('p');
    linkText.textContent = url;
    text.append(title, linkText);

    const actions = document.createElement('div');
    actions.className = 'reference-actions';

    const openLink = document.createElement('a');
    openLink.href = url;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.textContent = 'Open';

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        refs.statusPill.textContent = 'Link copied';
      } catch (error) {
        refs.statusPill.textContent = 'Copy blocked';
      }
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      state.references.splice(index, 1);
      saveReferences();
      renderReferences();
      refs.statusPill.textContent = 'Reference removed';
    });

    actions.append(openLink, copyButton, removeButton);
    item.append(text, actions);
    refs.referenceList.append(item);
  });

  if (!state.references.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-reference';
    empty.textContent = 'No reference links saved.';
    refs.referenceList.append(empty);
  }
}

function addReference(value) {
  const normalized = normalizeInstagramUrl(value);
  if (!normalized) {
    refs.statusPill.textContent = 'Add an Instagram link';
    return;
  }

  if (!state.references.includes(normalized)) {
    state.references.unshift(normalized);
    saveReferences();
    renderReferences();
  }

  refs.referenceUrl.value = '';
  refs.statusPill.textContent = 'Reference added';
}

function clearMedia() {
  refs.mediaLayer.querySelectorAll('img, video').forEach((node) => node.remove());
  refs.sampleArt.hidden = false;
}

function loadFile(file) {
  if (!file) return;
  if (state.mediaUrl) URL.revokeObjectURL(state.mediaUrl);
  state.mediaUrl = URL.createObjectURL(file);
  state.mediaType = file.type.startsWith('video/') ? 'video' : 'image';
  clearMedia();

  const media = document.createElement(state.mediaType === 'video' ? 'video' : 'img');
  media.src = state.mediaUrl;
  media.className = 'uploaded-media';
  media.dataset.exportMedia = 'true';
  media.alt = 'Uploaded reel preview media';

  if (state.mediaType === 'video') {
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.autoplay = true;
    media.addEventListener('loadeddata', () => media.play().catch(() => {}));
  }

  refs.sampleArt.hidden = true;
  refs.mediaLayer.appendChild(media);
  refs.statusPill.textContent = 'Media loaded';
}

function fitLayout() {
  refs.scale.value = '1.05';
  refs.offsetX.value = '0';
  refs.offsetY.value = '-28';
  updateTransform();
  refs.statusPill.textContent = 'Layout fitted';
}

function buildPreview() {
  refs.buildOverlay.hidden = false;
  refs.statusPill.textContent = 'Building';
  let progress = 0;
  refs.progressValue.textContent = '0%';
  refs.progressBar.style.width = '0%';

  const interval = window.setInterval(() => {
    progress = Math.min(100, progress + 10);
    refs.progressValue.textContent = `${progress}%`;
    refs.progressBar.style.width = `${progress}%`;
    if (progress >= 100) {
      window.clearInterval(interval);
      window.setTimeout(() => {
        refs.buildOverlay.hidden = true;
        refs.statusPill.textContent = 'Preview ready';
      }, 500);
    }
  }, 95);
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCoverMedia(ctx, source, canvasWidth, canvasHeight) {
  const sourceWidth = source.videoWidth || source.naturalWidth || canvasWidth;
  const sourceHeight = source.videoHeight || source.naturalHeight || canvasHeight;
  const coverScale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight) * state.scale;
  const drawWidth = sourceWidth * coverScale;
  const drawHeight = sourceHeight * coverScale;
  const x = (canvasWidth - drawWidth) / 2 + state.offsetX * 2.7;
  const y = (canvasHeight - drawHeight) / 2 + state.offsetY * 2.7;
  ctx.drawImage(source, x, y, drawWidth, drawHeight);
}

function drawSample(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#2730aa');
  gradient.addColorStop(.48, '#11182e');
  gradient.addColorStop(1, '#1a0d27');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = 'rgba(255,255,255,.24)';
  ctx.fillRect(170, 320, 720, 42);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  drawRoundRect(ctx, 140, 1180, 800, 280, 36);
  ctx.fill();
}

function drawOverlay(ctx) {
  ctx.save();
  ctx.font = '700 34px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,.8)';
  ctx.shadowBlur = 18;
  ctx.fillText('Following   For You', 540, 88);

  ctx.textAlign = 'left';
  ctx.font = '700 32px Arial';
  const username = refs.usernamePreview.textContent;
  ctx.fillText(username, 110, 1580);
  ctx.font = '400 30px Arial';
  wrapText(ctx, refs.captionPreview.textContent, 110, 1642, 720, 38, 3);
  ctx.font = '400 25px Arial';
  ctx.fillText('Original audio', 110, 1815);

  ctx.textAlign = 'center';
  ctx.font = '700 25px Arial';
  const actionX = 992;
  const actions = [['H', refs.likesPreview.textContent], ['C', refs.commentsPreview.textContent], ['S', ''], ['M', '']];
  actions.forEach(([label, count], index) => {
    const y = 1160 + index * 145;
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.arc(actionX, y, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, actionX, y + 10);
    if (count) ctx.fillText(count, actionX, y + 72);
  });
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
}

function exportPreview() {
  const ctx = refs.canvas.getContext('2d');
  const media = refs.mediaLayer.querySelector('[data-export-media="true"]');
  ctx.clearRect(0, 0, refs.canvas.width, refs.canvas.height);

  if (media && (media.readyState >= 2 || media.complete)) {
    drawCoverMedia(ctx, media, refs.canvas.width, refs.canvas.height);
  } else {
    drawSample(ctx);
  }

  if (refs.safeToggle.checked) {
    ctx.fillStyle = 'rgba(255,79,123,.12)';
    ctx.fillRect(0, 0, 1080, 150);
    ctx.fillStyle = 'rgba(244,200,76,.13)';
    ctx.fillRect(910, 0, 170, 1920);
    ctx.fillStyle = 'rgba(36,200,242,.13)';
    ctx.fillRect(0, 1560, 1080, 360);
  }

  if (refs.chromeToggle.checked) drawOverlay(ctx);

  const link = document.createElement('a');
  link.download = 'reel-instant-preview.png';
  link.href = refs.canvas.toDataURL('image/png');
  link.click();
  refs.statusPill.textContent = 'PNG exported';
}

refs.mediaInput.addEventListener('change', (event) => loadFile(event.target.files[0]));
refs.dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  refs.dropZone.classList.add('dragover');
});
refs.dropZone.addEventListener('dragleave', () => refs.dropZone.classList.remove('dragover'));
refs.dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  refs.dropZone.classList.remove('dragover');
  loadFile(event.dataTransfer.files[0]);
});

[refs.username, refs.caption, refs.likes, refs.comments].forEach((input) => {
  input.addEventListener('input', updateText);
});

[refs.scale, refs.offsetX, refs.offsetY].forEach((input) => {
  input.addEventListener('input', updateTransform);
});

[refs.safeToggle, refs.gridToggle, refs.chromeToggle].forEach((input) => {
  input.addEventListener('change', updateToggles);
});

refs.buildButton.addEventListener('click', buildPreview);
refs.fitButton.addEventListener('click', fitLayout);
refs.fitFromOverlay.addEventListener('click', fitLayout);
refs.exportButton.addEventListener('click', exportPreview);
refs.referenceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addReference(refs.referenceUrl.value);
});

loadReferences();
renderReferences();
updateText();
updateTransform();
updateToggles();
