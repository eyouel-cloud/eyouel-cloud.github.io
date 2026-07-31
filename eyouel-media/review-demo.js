const demoSteps = [
  {
    kicker: 'Official website',
    title: 'Eyouel Media Creator Console',
    status: 'Review ready',
    url: 'https://eyouel-cloud.github.io/eyouel-media/',
    html: `
      <div class="demo-product-grid">
        <article class="demo-product-card">
          <span class="step">Creator studio</span>
          <h3>Faith-Based Video Queue</h3>
          <p>The Website URL opens directly to the creator console with video queue, review workspace, caption editor, posting checks, and policy pages.</p>
          <div class="content-row"><div><strong>Morning Encouragement</strong><span>Original creator-owned video</span></div><span class="up">Ready</span></div>
          <div class="content-row"><div><strong>Prayer Reflection</strong><span>Creator review required</span></div><span class="flat">Review</span></div>
        </article>
        <article class="demo-product-card">
          <span class="step">Website URL</span>
          <h3>Full App Surface</h3>
          <p>The site is not a login-only page. Reviewers can inspect the dashboard, media library, Direct Post controls, draft fallback, terms, and privacy policy without signing in.</p>
        </article>
      </div>
    `
  },
  {
    kicker: 'Login Kit',
    title: 'Creator Authorizes With TikTok',
    status: 'OAuth started',
    url: 'https://eyouel-cloud.github.io/eyouel-media/login.html',
    html: `
      <div class="auth-card">
        <img src="/eyouel-media/assets/eyouel-media-icon.svg" alt="Eyouel Media icon">
        <div>
          <h3>Continue with TikTok</h3>
          <p>The creator starts OAuth with client_key, response_type=code, redirect_uri, state, and requested scopes.</p>
        </div>
      </div>
      <div class="scope-grid">
        <span>user.info.basic</span>
        <span>video.publish</span>
        <span>video.upload</span>
      </div>
      <div class="code-block">GET https://www.tiktok.com/v2/auth/authorize/?client_key=...&amp;scope=user.info.basic,video.publish,video.upload&amp;response_type=code</div>
    `
  },
  {
    kicker: 'Redirect callback',
    title: 'Authorization Code Returned',
    status: 'Code received',
    url: 'https://eyouel-cloud.github.io/eyouel-media/auth/tiktok/callback.html?code=mock_code&state=valid_state',
    html: `
      <div class="callback-panel">
        <div class="success-mark">✓</div>
        <div>
          <h3>TikTok returned to the registered redirect URI</h3>
          <p>The backend validates state and redeems the authorization code server-side. The client secret is never exposed in the browser.</p>
        </div>
      </div>
      <div class="code-block">POST /oauth/access_token/ -> access_token + refresh_token stored server-side</div>
    `
  },
  {
    kicker: 'creator_info/query',
    title: 'Creator Settings Rendered In The App',
    status: 'Creator loaded',
    url: 'https://eyouel-cloud.github.io/eyouel-media/post.html?authorized=1',
    html: `
      <div class="creator-info-grid">
        <article class="creator-card">
          <div class="avatar-large">EM</div>
          <div>
            <h3>@eyouelmedia</h3>
            <p>Display name and avatar are shown from user.info.basic.</p>
          </div>
        </article>
        <article class="creator-card">
          <span class="step">Posting options</span>
          <p>Privacy and interaction controls are rendered from /v2/post/publish/creator_info/query/ before publishing.</p>
        </article>
      </div>
      <div class="settings-matrix">
        <span>Privacy options</span><strong>PUBLIC_TO_EVERYONE, FOLLOWER_OF_CREATOR, SELF_ONLY</strong>
        <span>Max duration</span><strong>180 seconds</strong>
        <span>Interactions</span><strong>Comments allowed, duet optional, stitch optional</strong>
      </div>
    `
  },
  {
    kicker: 'video.publish',
    title: 'Creator Reviews Direct Post',
    status: 'Consent required',
    url: 'https://eyouel-cloud.github.io/eyouel-media/post.html',
    html: `
      <div class="composer-grid">
        <div class="demo-video-preview">
          <img src="/eyouel-media/assets/eyouel-media-icon.svg" alt="Eyouel Media icon">
          <strong>Morning Encouragement</strong>
          <span>Original creator-owned faith-based video.</span>
        </div>
        <div>
          <label>Caption</label>
          <textarea>A short reminder to start the day with faith, gratitude, and courage. Original creator-owned video.</textarea>
          <label>Privacy</label>
          <select><option>PUBLIC_TO_EVERYONE</option><option>SELF_ONLY</option></select>
          <div class="checks">
            <label><input type="checkbox" checked> Allow comments when permitted</label>
            <label><input type="checkbox"> Allow duet</label>
            <label><input type="checkbox"> Allow stitch</label>
            <label><input type="checkbox" checked> Creator consent confirmed for Direct Post</label>
          </div>
        </div>
      </div>
    `
  },
  {
    kicker: 'FILE_UPLOAD',
    title: 'Direct Post Initialized And Uploaded',
    status: 'Polling status',
    url: 'https://eyouel-cloud.github.io/eyouel-media/post.html#publish-status',
    html: `
      <div class="upload-grid">
        <article class="upload-card"><span class="step">1 Initialize</span><h3>/v2/post/publish/video/init/</h3><p>post_info includes caption, privacy, interaction settings, consent, and source_info FILE_UPLOAD.</p></article>
        <article class="upload-card"><span class="step">2 Upload MP4</span><h3>PUT returned upload_url</h3><p>The app sends the selected creator-owned MP4 to TikTok servers.</p></article>
        <article class="upload-card"><span class="step">3 Poll status</span><h3>Publish status returned</h3><p>The creator sees processing, success, or actionable error status in the app.</p></article>
      </div>
      <div class="progress-shell"><span style="width: 86%"></span></div>
    `
  },
  {
    kicker: 'video.upload',
    title: 'Creator Draft Upload Fallback',
    status: 'Draft ready',
    url: 'https://eyouel-cloud.github.io/eyouel-media/post.html#draft-upload',
    html: `
      <div class="draft-panel">
        <div>
          <span class="step">Draft fallback</span>
          <h3>Upload to TikTok drafts</h3>
          <p>If the creator chooses not to Direct Post, the reviewed MP4 can be sent to TikTok as a draft with video.upload. The creator finishes editing and posting inside TikTok.</p>
        </div>
        <button class="primary" type="button">Send As TikTok Draft</button>
      </div>
      <div class="code-block">POST /v2/post/publish/inbox/video/init/ -> upload_url + publish_id</div>
    `
  }
];

const content = document.getElementById('demo-content');
const kicker = document.getElementById('demo-kicker');
const title = document.getElementById('demo-title');
const statusChip = document.getElementById('demo-status');
const url = document.getElementById('demo-url');
const prev = document.getElementById('prev-step');
const next = document.getElementById('next-step');
const stepButtons = Array.from(document.querySelectorAll('.demo-step'));
let currentStep = 0;

function renderStep(index) {
  currentStep = Math.max(0, Math.min(demoSteps.length - 1, index));
  const step = demoSteps[currentStep];
  kicker.textContent = step.kicker;
  title.textContent = step.title;
  statusChip.textContent = step.status;
  url.textContent = step.url;
  content.innerHTML = step.html;
  prev.disabled = currentStep === 0;
  next.textContent = currentStep === demoSteps.length - 1 ? 'Restart Demo' : 'Next Step';
  stepButtons.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.step) === currentStep);
  });
}

stepButtons.forEach((button) => {
  button.addEventListener('click', () => renderStep(Number(button.dataset.step)));
});

prev.addEventListener('click', () => renderStep(currentStep - 1));
next.addEventListener('click', () => renderStep(currentStep === demoSteps.length - 1 ? 0 : currentStep + 1));

renderStep(0);
