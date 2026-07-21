// Download + build guide page
export default function DownloadPage() {
  return (
    <div className="min-h-screen px-4 py-12 flex flex-col items-center gap-10"
      style={{ background: '#1a1b1e', fontFamily: 'sans-serif' }}>
      <Header />
      <DownloadZip />
      <BuildGuide />
      <BackLink />
    </div>
  );
}

/* ── Header ─────────────────────────────────────────── */
function Header() {
  return (
    <div className="text-center max-w-lg">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#5865f2,#eb459e)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">Get NexusChat for Windows</h1>
        <p style={{ color: '#96989d', lineHeight: 1.6 }}>
        No Linux or terminal needed — just a Windows PC and a free GitHub account.
        The ZIP has only <strong className="text-white">48 plain text files</strong> — no binaries,
        no secrets, well under GitHub&apos;s limit. Unzip, drag into GitHub, done.
      </p>
    </div>
  );
}

/* ── Download ZIP card ──────────────────────────────── */
function DownloadZip() {
  return (
    <div className="w-full max-w-lg rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#96989d' }}>
        Step 0 — Download source code
      </p>
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1e1f22' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#5865f2' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.57 15.43 0 12.3 0c-1.7 0-3.2.8-4.2 2.05L7 3l-1.1-1C4.84.75 3.59.25 2.25.25 1 .25 0 1.25 0 2.5c0 1.04.68 1.92 1.63 2.24V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">nexuschat-source.zip</div>
          <div className="text-xs" style={{ color: '#96989d' }}>48 text files · ~65 KB · no binaries, safe to upload</div>
        </div>
        <a href="/nexuschat-source.zip" download="nexuschat-source.zip"
          className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-80"
          style={{ background: '#5865f2', textDecoration: 'none' }}>
          Download
        </a>
      </div>
    </div>
  );
}

/* ── Step card ──────────────────────────────────────── */
function Step({ n, title, body, code, highlight, tip }: {
  n: string; title: string; body: string;
  code?: string; highlight?: string; tip?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5865f2,#eb459e)' }}>
          {n}
        </div>
        <div className="flex-1 w-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', minHeight: 24 }} />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <h3 className="text-base font-bold text-white mb-1">{title}</h3>
        <p className="text-sm mb-2" style={{ color: '#96989d', lineHeight: 1.6 }}>{body}</p>
        {code && (
          <div className="px-3 py-2 rounded-lg font-mono text-xs mb-2 overflow-x-auto"
            style={{ background: '#1e1f22', color: '#5865f2' }}>
            {code}
          </div>
        )}
        {highlight && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(35,165,89,0.1)', color: '#23a559', border: '1px solid rgba(35,165,89,0.2)' }}>
            <span className="flex-shrink-0">✓</span>
            <span>{highlight}</span>
          </div>
        )}
        {tip && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs mt-2"
            style={{ background: 'rgba(88,101,242,0.1)', color: '#c9cdfb', border: '1px solid rgba(88,101,242,0.2)' }}>
            <span className="flex-shrink-0">💡</span>
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Full guide ─────────────────────────────────────── */
function BuildGuide() {
  return (
    <div className="w-full max-w-lg rounded-2xl p-6"
      style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#96989d' }}>
        Build your .exe — no Linux needed, everything runs in the cloud
      </p>

      <Step n="1" title="Create a free GitHub account"
        body="Go to github.com and sign up. It's free. GitHub will be the machine that builds your .exe for you."
        code="https://github.com/signup"
        highlight="No credit card required. Takes 2 minutes."
      />

      <Step n="2" title="Create a new repository"
        body='After signing in, click the green "New" button on github.com. Name it nexuschat. Set it to Public. Click "Create repository".'
        highlight="Public repos get free GitHub Actions build minutes."
      />

      <Step n="3" title="Unzip the file first"
        body="Right-click nexuschat-source.zip on your Windows PC → click Extract All → choose a folder like C:\nexuschat → click Extract. This gives you a folder full of files."
        highlight="GitHub cannot read a .zip — you must extract it first."
        tip="After extracting you will see folders like app/, components/, electron/ etc."
      />

      <Step n="4" title="Upload all 50 files to GitHub"
        body={`On your new repo page click "uploading an existing file". Open the extracted nexuschat folder in File Explorer. Press Ctrl+A to select everything inside, then drag it all into the GitHub upload box. Wait for all files to appear listed, then click "Commit changes".`}
        highlight="Only 50 files — GitHub's web uploader handles this easily."
        tip="Drag the CONTENTS of the folder, not the folder itself. You should see files like package.json and folders like app/, components/ appear in the upload list."
      />

      <Step n="5" title="Wait ~5 minutes for the build"
        body={`Click the "Actions" tab at the top of your repository. You'll see "Build NexusChat Windows .exe" running. A green spinning icon means it's working.`}
        highlight="GitHub's cloud Windows machine compiles everything for you."
      />

      <Step n="6" title="Download your installer"
        body={`When the Action shows a green checkmark, click it. Scroll to the bottom to find "Artifacts" and click "NexusChat-Windows-Installer" to download. Or check the Releases tab for the installer directly.`}
        highlight={`You get a real "NexusChat Setup.exe" — double-click to install!`}
        tip="The .exe creates a Desktop shortcut and Start Menu entry automatically."
      />

      <div className="mt-2 p-4 rounded-xl text-sm"
        style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="font-bold text-white mb-2">Every future update is automatic 🔄</p>
        <p style={{ color: '#96989d', lineHeight: 1.6 }}>
          Whenever you want to update the app, just upload new files to GitHub — 
          it automatically rebuilds and publishes a new <code style={{ color: '#5865f2' }}>.exe</code> under Releases.
        </p>
      </div>
    </div>
  );
}

/* ── Back link ──────────────────────────────────────── */
function BackLink() {
  return (
    <a href="/" style={{ color: '#5865f2', fontSize: 13, textDecoration: 'none' }}>
      ← Back to NexusChat
    </a>
  );
}
