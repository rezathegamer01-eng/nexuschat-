'use client';
import { useState } from 'react';

const WORKFLOW = `name: Build NexusChat Windows .exe

on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install --legacy-peer-deps electron electron-builder

      - name: Create icon
        shell: bash
        run: node -e "const fs=require('fs');const p=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');fs.mkdirSync('public',{recursive:true});fs.writeFileSync('public/icon.png',p);"

      - name: Build Windows .exe
        run: npx electron-builder --win --x64
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Upload .exe artifact
        uses: actions/upload-artifact@v4
        with:
          name: NexusChat-Windows-Installer
          path: dist-electron/*.exe
          retention-days: 30`;  // end of WORKFLOW string

export default function WorkflowPage() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(WORKFLOW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen px-4 py-10 flex flex-col items-center gap-6"
      style={{ background: '#1a1b1e', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div className="text-center max-w-lg">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#5865f2,#eb459e)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Add the Build Workflow</h1>
        <p style={{ color: '#96989d', lineHeight: 1.6, fontSize: 14 }}>
          Follow the 3 steps below to add the GitHub Actions workflow file.
          This tells GitHub to build your .exe automatically.
        </p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-xl flex flex-col gap-4">

        {/* Step 1 */}
        <div className="rounded-2xl p-5" style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: '#5865f2' }}>1</div>
            <h2 className="text-base font-bold text-white">On GitHub — click Add file → Create new file</h2>
          </div>
          <p className="text-sm mb-3" style={{ color: '#96989d' }}>
            Then type this exact path into the filename box at the top of the editor:
          </p>
          <CopyLine text=".github/workflows/build-exe.yml"
            note="GitHub creates the folders automatically when you type the / slashes" />
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl p-5" style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: '#5865f2' }}>2</div>
            <h2 className="text-base font-bold text-white">Copy the workflow content below</h2>
          </div>
          <p className="text-sm mb-3" style={{ color: '#96989d' }}>
            Click the button to copy, then paste it into the big editor area on GitHub.
          </p>
          {/* Copy button */}
          <button onClick={copy}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 mb-3"
            style={{ background: copied ? '#23a559' : '#5865f2', fontSize: 15 }}>
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Copied to clipboard!
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy Workflow Content
              </>
            )}
          </button>
          {/* Preview of workflow */}
          <pre className="rounded-xl p-3 text-xs overflow-auto max-h-48 dc-scrollbar"
            style={{ background: '#1e1f22', color: '#96989d', fontFamily: 'monospace' }}>
            {WORKFLOW}
          </pre>
        </div>

        {/* Step 3 */}
        <div className="rounded-2xl p-5" style={{ background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: '#5865f2' }}>3</div>
            <h2 className="text-base font-bold text-white">Commit the file</h2>
          </div>
          <p className="text-sm" style={{ color: '#96989d', lineHeight: 1.6 }}>
            Scroll down on the GitHub page and click the green{' '}
            <strong className="text-white">"Commit new file"</strong> button.
            GitHub will immediately start building your .exe — go to the{' '}
            <strong className="text-white">Actions</strong> tab to watch it run.
          </p>
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(35,165,89,0.1)', color: '#23a559', border: '1px solid rgba(35,165,89,0.2)' }}>
            <span>✓</span>
            <span>After ~5 minutes you will see a green checkmark. Click it → scroll to Artifacts → download NexusChat-Windows-Installer.zip → open it → double-click the .exe to install!</span>
          </div>
        </div>

      </div>

      <a href="/" style={{ color: '#5865f2', fontSize: 13, textDecoration: 'none' }}>
        ← Back to NexusChat
      </a>
    </div>
  );
}

function CopyLine({ text, note }: { text: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
          style={{ background: '#1e1f22', color: '#5865f2' }}>
          {text}
        </code>
        <button onClick={copy}
          className="px-3 py-2 rounded-lg text-sm font-bold flex-shrink-0 transition-colors"
          style={{ background: copied ? '#23a559' : '#383a40', color: '#fff' }}>
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
      {note && <p className="text-xs mt-1" style={{ color: '#72767d' }}>{note}</p>}
    </div>
  );
}
