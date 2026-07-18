const REFERENCE_STORAGE_KEY = 'reel-preview-reference-links';
const DEFAULT_REFERENCES = [
  'https://www.instagram.com/p/CkgR20xjQS4/'
];

const templates = {
  fast: {
    duration: 10,
    beats: [0, .45, .88, 1.32, 1.78, 2.22, 2.68, 3.14, 3.62, 4.12, 4.72, 5.28, 5.9, 6.55, 7.22, 8.0, 8.82, 10],
    effects: ['zoomIn', 'pushLeft', 'flash', 'zoomOut', 'pushUp']
  },
  smooth: {
    duration: 12,
    beats: [0, 1.2, 2.4, 3.55, 4.75, 6, 7.2, 8.45, 9.65, 10.85, 12],
    effects: ['zoomIn', 'zoomOut', 'driftLeft', 'driftRight']
  },
  cinematic: {
    duration: 15,
    beats: [0, 1.8, 3.4, 5.0, 6.7, 8.4, 10.0, 11.7, 13.3, 15],
    effects: ['kenBurnsIn', 'kenBurnsOut', 'tiltIn', 'driftUp']
  },
  flash: {
    duration: 9,
    beats: [0, .55, 1.1, 1.65, 2.2, 2.78, 3.34, 3.9, 4.5, 5.08, 5.68, 6.3, 7, 7.75, 8.4, 9],
    effects: ['flash', 'snapZoom', 'pushLeft', 'pushRight']
  }
};

const state = {
  references: [],
  referenceVideoUrl: '',
  referenceVideoFile: null,
  referenceDuration: 0,
  referenceCuts: [],
  media: [],
  timeline: [],
  playing: false,
  playStartedAt: 0,
  playOffset: 0,
  exportRecorder: null
};

const refs = {
  referenceForm: document.getElementById('reference-form'),
  referenceUrl: document.getElementById('reference-url'),
  referenceVideo: document.getElementById('reference-video'),
  referenceFileName: document.getElementById('reference-file-name'),
  analyzeButton: document.getElementById('analyze-button'),
  mediaInput: document.getElementById('media-input'),
  mediaCount: document.getElementById('media-count'),
  mediaStrip: document.getElementById('media-strip'),
  templateSelect: document.getElementById('template-select'),
  hookText: document.getElementById('hook-text'),
  captionText: document.getElementById('caption-text'),
  durationInput: document.getElementById('duration-input'),
  intensityInput: document.getElementById('intensity-input'),
  generateButton: document.getElementById('generate-button'),
  playButton: document.getElementById('play-button'),
  exportButton: document.getElementById('export-button'),
  canvas: document.getElementById('preview-canvas'),
  statusPill: document.getElementById('status-pill'),
  referenceList: document.getElementById('reference-list'),
  referenceCount: document.getElementById('reference-count'),
  timelineList: document.getElementById('timeline-list'),
  timelineCount: document.getElementById('timeline-count')
};

const ctx = refs.canvas.getContext('2d');

function setStatus(text) {
  refs.statusPill.textContent = text;
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

    const title = document.createElement('strong');
    title.textContent = referenceLabel(url);
    const linkText = document.createElement('p');
    linkText.textContent = url;

    const actions = document.createElement('div');
    actions.className = 'reference-actions';

    const open = document.createElement('a');
    open.href = url;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.textContent = 'Open';

    const use = document.createElement('button');
    use.type = 'button';
    use.textContent = 'Use';
    use.addEventListener('click', () => {
      refs.referenceUrl.value = url;
      setStatus('Reference loaded');
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      state.references.splice(index, 1);
      saveReferences();
      renderReferences();
      setStatus('Reference removed');
    });

    actions.append(open, use, remove);
    item.append(title, linkText, actions);
    refs.referenceList.append(item);
  });

  if (!state.references.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No reference links saved yet.';
    refs.referenceList.append(empty);
  }
}

function addReference(value) {
  const normalized = normalizeInstagramUrl(value);
  if (!normalized) {
    setStatus('Add an Instagram link');
    return;
  }

  if (!state.references.includes(normalized)) {
    state.references.unshift(normalized);
    saveReferences();
    renderReferences();
  }

  refs.referenceUrl.value = normalized;
  setStatus('Reference saved');
}

function loadImageAsset(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ file, url, element: img, type: 'image', name: file.name });
    img.onerror = reject;
    img.src = url;
  });
}

function loadVideoAsset(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => resolve({ file, url, element: video, type: 'video', name: file.name });
    video.onerror = reject;
  });
}

function loadMediaAsset(file) {
  return file.type.startsWith('video/') ? loadVideoAsset(file) : loadImageAsset(file);
}

function playMediaAssets() {
  state.media.forEach((asset) => {
    if (asset.type === 'video') {
      asset.element.play().catch(() => {});
    }
  });
}

async function loadMediaFiles(files) {
  state.media.forEach((asset) => URL.revokeObjectURL(asset.url));
  state.media = await Promise.all(Array.from(files).map(loadMediaAsset));
  const imageCount = state.media.filter((asset) => asset.type === 'image').length;
  const videoCount = state.media.filter((asset) => asset.type === 'video').length;
  refs.mediaCount.textContent = `${state.media.length} selected: ${imageCount} photo${imageCount === 1 ? '' : 's'}, ${videoCount} video${videoCount === 1 ? '' : 's'}`;
  renderMediaStrip();
  generateTimeline();
  setStatus('Media loaded');
}

function renderMediaStrip() {
  refs.mediaStrip.replaceChildren();
  state.media.slice(0, 15).forEach((asset) => {
    const thumb = document.createElement('div');
    thumb.className = 'media-thumb';
    thumb.title = asset.name;

    if (asset.type === 'video') {
      const video = document.createElement('video');
      video.src = asset.url;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      thumb.append(video);
    } else {
      thumb.style.backgroundImage = `url("${asset.url}")`;
    }

    const kind = document.createElement('span');
    kind.className = 'media-kind';
    kind.textContent = asset.type;
    thumb.append(kind);
    refs.mediaStrip.append(thumb);
  });
}

function selectedTemplate() {
  return templates[refs.templateSelect.value] || templates.fast;
}

function templateCuts() {
  const template = selectedTemplate();
  const targetDuration = Number(refs.durationInput.value) || template.duration;
  const scale = targetDuration / template.duration;
  return template.beats.map((beat) => Number((beat * scale).toFixed(3)));
}

function normalizeCuts(cuts, duration) {
  const cleaned = Array.from(new Set(cuts.concat([0, duration]).map((cut) => Math.max(0, Math.min(duration, cut)))))
    .sort((a, b) => a - b);
  return cleaned.filter((cut, index) => index === 0 || cut - cleaned[index - 1] >= .24 || cut === duration);
}

function createTimelineFromCuts(cuts) {
  const media = state.media.length ? state.media : [null];
  const template = selectedTemplate();
  const intensity = Number(refs.intensityInput.value) / 100;
  const timeline = [];

  for (let index = 0; index < cuts.length - 1; index += 1) {
    const start = cuts[index];
    const end = cuts[index + 1];
    if (end <= start) continue;
    timeline.push({
      start,
      end,
      asset: media[index % media.length],
      effect: template.effects[index % template.effects.length],
      flash: index > 0 && (index % 2 === 0 || intensity > .72),
      intensity
    });
  }

  return timeline;
}

function generateTimeline() {
  const referenceDuration = state.referenceDuration || 0;
  const duration = referenceDuration || Number(refs.durationInput.value) || selectedTemplate().duration;
  const cuts = state.referenceCuts.length > 2
    ? normalizeCuts(state.referenceCuts, duration)
    : normalizeCuts(templateCuts(), duration);

  refs.durationInput.value = String(Math.round(duration));
  state.timeline = createTimelineFromCuts(cuts);
  renderTimelineList();
  drawFrame(0);
  setStatus('Mimic map ready');
}

function renderTimelineList() {
  refs.timelineList.replaceChildren();
  refs.timelineCount.textContent = `${state.timeline.length} cuts`;

  state.timeline.forEach((cut, index) => {
    const item = document.createElement('article');
    item.className = 'timeline-item';

    const title = document.createElement('strong');
    title.textContent = `Cut ${index + 1}: ${cut.effect}`;
    const photo = document.createElement('p');
    photo.textContent = cut.asset ? cut.asset.name : 'Sample background';
    const meta = document.createElement('div');
    meta.className = 'timeline-meta';
    meta.innerHTML = `<span>${cut.start.toFixed(2)}s</span><span>${(cut.end - cut.start).toFixed(2)}s</span>`;

    item.append(title, photo, meta);
    refs.timelineList.append(item);
  });

  if (!state.timeline.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Upload media or generate a timeline.';
    refs.timelineList.append(empty);
  }
}

function makeVideoElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => resolve({ video, url });
    video.onerror = reject;
  });
}

function seekVideo(video, time) {
  return new Promise((resolve) => {
    const finish = () => {
      video.removeEventListener('seeked', finish);
      resolve();
    };
    video.addEventListener('seeked', finish);
    video.currentTime = Math.min(Math.max(time, 0), video.duration || time);
  });
}

async function analyzeReferenceTiming() {
  if (!state.referenceVideoFile) {
    state.referenceCuts = [];
    state.referenceDuration = 0;
    generateTimeline();
    setStatus('Using fallback template');
    return;
  }

  setStatus('Analyzing reference');
  const { video, url } = await makeVideoElement(state.referenceVideoFile);
  const duration = Math.min(video.duration || 0, 45);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 48;
  sampleCanvas.height = 86;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const cuts = [0];
  let previous = null;
  let lastCut = 0;

  for (let time = .2; time < duration; time += .2) {
    await seekVideo(video, time);
    sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const data = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
    let diff = 0;
    let brightness = 0;

    for (let index = 0; index < data.length; index += 16) {
      const value = (data[index] + data[index + 1] + data[index + 2]) / 3;
      brightness += value;
      if (previous) diff += Math.abs(value - previous[index / 16]);
    }

    const samples = data.length / 16;
    const current = new Array(samples);
    for (let index = 0; index < data.length; index += 16) {
      current[index / 16] = (data[index] + data[index + 1] + data[index + 2]) / 3;
    }

    if (previous) {
      const avgDiff = diff / samples;
      const avgBrightness = brightness / samples;
      const isCut = avgDiff > 28 || (avgDiff > 20 && avgBrightness > 190);
      if (isCut && time - lastCut > .35) {
        cuts.push(Number(time.toFixed(2)));
        lastCut = time;
      }
    }

    previous = current;
  }

  cuts.push(duration);
  URL.revokeObjectURL(url);
  state.referenceDuration = duration;
  state.referenceCuts = cuts.length > 3 ? cuts : [];
  generateTimeline();
  setStatus(state.referenceCuts.length ? 'Reference timing mapped' : 'Template timing mapped');
}

function currentCut(time) {
  if (!state.timeline.length) return null;
  const total = state.timeline[state.timeline.length - 1].end;
  const wrapped = total ? time % total : 0;
  return state.timeline.find((cut) => wrapped >= cut.start && wrapped < cut.end) || state.timeline[state.timeline.length - 1];
}

function easeInOut(value) {
  return value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function coverDrawImage(image, x, y, width, height) {
  const sourceWidth = image.naturalWidth || image.videoWidth || width;
  const sourceHeight = image.naturalHeight || image.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#2631ad');
  gradient.addColorStop(.5, '#151c31');
  gradient.addColorStop(1, '#261028');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = 'rgba(255,255,255,.20)';
  ctx.fillRect(140, 340, 800, 48);
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  ctx.fillRect(230, 420, 620, 36);
}

function drawMedia(cut, localProgress) {
  if (!cut?.asset) {
    drawBackground();
    return;
  }

  const p = easeInOut(localProgress);
  const strength = cut.intensity;
  let scale = 1 + .08 * strength;
  let tx = 0;
  let ty = 0;
  let rotation = 0;

  if (cut.effect === 'zoomIn' || cut.effect === 'kenBurnsIn') scale = 1 + p * .18 * strength;
  if (cut.effect === 'zoomOut' || cut.effect === 'kenBurnsOut') scale = 1.16 - p * .14 * strength;
  if (cut.effect === 'pushLeft') tx = (1 - p) * 140 * strength;
  if (cut.effect === 'pushRight') tx = -(1 - p) * 140 * strength;
  if (cut.effect === 'pushUp' || cut.effect === 'driftUp') ty = (1 - p) * 110 * strength;
  if (cut.effect === 'driftLeft') tx = -p * 80 * strength;
  if (cut.effect === 'driftRight') tx = p * 80 * strength;
  if (cut.effect === 'tiltIn') rotation = (-2 + p * 2) * Math.PI / 180;
  if (cut.effect === 'snapZoom') scale = 1 + Math.sin(p * Math.PI) * .22 * strength;

  ctx.save();
  ctx.translate(540 + tx, 960 + ty);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  coverDrawImage(cut.asset.element, -540, -960, 1080, 1920);
  ctx.restore();
}

function drawReelUi(time) {
  const hook = refs.hookText.value.trim();
  const caption = refs.captionText.value.trim();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.85)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';

  ctx.textAlign = 'center';
  ctx.font = '800 48px Arial';
  if (hook && time < 3.2) wrapText(hook, 540, 160, 840, 58, 3, 'center');

  ctx.font = '700 32px Arial';
  ctx.fillText('Following   For You', 540, 72);

  ctx.textAlign = 'left';
  ctx.font = '800 32px Arial';
  ctx.fillText('@yourbrand', 88, 1585);
  ctx.font = '400 30px Arial';
  wrapText(caption || 'New version using my own media.', 88, 1642, 760, 38, 3, 'left');
  ctx.font = '400 25px Arial';
  ctx.fillText('Original audio', 88, 1815);

  ctx.textAlign = 'center';
  ctx.font = '800 25px Arial';
  const actionX = 992;
  [['H', '12.4K'], ['C', '218'], ['S', ''], ['M', '']].forEach(([label, count], index) => {
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

function wrapText(text, x, y, maxWidth, lineHeight, maxLines, align) {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = next;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
}

function drawFrame(time) {
  const cut = currentCut(time);
  const progress = cut ? (time - cut.start) / (cut.end - cut.start) : 0;
  ctx.clearRect(0, 0, refs.canvas.width, refs.canvas.height);
  drawMedia(cut, Math.max(0, Math.min(1, progress)));

  if (cut?.flash && progress < .16) {
    ctx.fillStyle = `rgba(255,255,255,${(.16 - progress) * 3})`;
    ctx.fillRect(0, 0, 1080, 1920);
  }

  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(0, 0, 1080, 1920);
  drawReelUi(time);
}

function animationLoop(now) {
  if (!state.playing) return;
  const time = state.playOffset + (now - state.playStartedAt) / 1000;
  drawFrame(time);
  requestAnimationFrame(animationLoop);
}

function togglePlay() {
  state.playing = !state.playing;
  refs.playButton.textContent = state.playing ? 'Pause' : 'Play';
  if (state.playing) {
    playMediaAssets();
    state.playStartedAt = performance.now();
    requestAnimationFrame(animationLoop);
  } else {
    const total = state.timeline[state.timeline.length - 1]?.end || 0;
    state.playOffset = total ? (state.playOffset + (performance.now() - state.playStartedAt) / 1000) % total : 0;
  }
}

function renderExportFrame(startTime) {
  const elapsed = (performance.now() - startTime) / 1000;
  drawFrame(elapsed);
  const total = state.timeline[state.timeline.length - 1]?.end || 0;
  if (elapsed < total && state.exportRecorder?.state === 'recording') {
    requestAnimationFrame(() => renderExportFrame(startTime));
  } else if (state.exportRecorder?.state === 'recording') {
    state.exportRecorder.stop();
  }
}

function exportWebm() {
  if (!state.timeline.length) generateTimeline();
  playMediaAssets();
  const stream = refs.canvas.captureStream(30);
  const chunks = [];
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  state.exportRecorder = recorder;

  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const link = document.createElement('a');
    link.download = 'reel-mimic-builder.webm';
    link.href = URL.createObjectURL(blob);
    link.click();
    setStatus('WebM exported');
  };

  setStatus('Exporting');
  recorder.start();
  renderExportFrame(performance.now());
}

refs.referenceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addReference(refs.referenceUrl.value);
});

refs.referenceVideo.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (state.referenceVideoUrl) URL.revokeObjectURL(state.referenceVideoUrl);
  state.referenceVideoFile = file;
  state.referenceVideoUrl = URL.createObjectURL(file);
  refs.referenceFileName.textContent = file.name;
  setStatus('Reference video loaded');
});

refs.mediaInput.addEventListener('change', (event) => {
  loadMediaFiles(event.target.files).catch(() => setStatus('Media load failed'));
});

refs.analyzeButton.addEventListener('click', () => {
  analyzeReferenceTiming().catch(() => {
    state.referenceCuts = [];
    state.referenceDuration = 0;
    generateTimeline();
    setStatus('Analysis fallback used');
  });
});

refs.generateButton.addEventListener('click', generateTimeline);
refs.playButton.addEventListener('click', togglePlay);
refs.exportButton.addEventListener('click', exportWebm);
refs.templateSelect.addEventListener('change', generateTimeline);
refs.durationInput.addEventListener('change', generateTimeline);
refs.intensityInput.addEventListener('input', () => {
  generateTimeline();
});
refs.hookText.addEventListener('input', () => drawFrame(state.playOffset));
refs.captionText.addEventListener('input', () => drawFrame(state.playOffset));

loadReferences();
renderReferences();
generateTimeline();
