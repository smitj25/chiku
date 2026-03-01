import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('smeplug.compare', () => {
            ComparePanel.createOrShow(context.extensionUri);
        })
    );
}
export function deactivate() { }

class ComparePanel {
    public static currentPanel: ComparePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        if (ComparePanel.currentPanel) {
            ComparePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            'smeplugCompare', 'SME-Plug: Hallucination vs Cited',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        ComparePanel.currentPanel = new ComparePanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getHtml();
        this._panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.type === 'query') {
                await this._handleQuery(msg.message, msg.plugId, msg.apiKey, msg.backendUrl);
            }
            if (msg.type === 'getConfig') {
                const cfg = vscode.workspace.getConfiguration('smeplug');
                this._panel.webview.postMessage({
                    type: 'config',
                    apiKey: cfg.get('apiKey', ''),
                    pluginId: cfg.get('pluginId', 'legal'),
                    backendUrl: cfg.get('backendUrl', 'http://localhost:8000'),
                });
            }
        }, null, this._disposables);
    }

    private async _handleQuery(message: string, plugId: string, apiKey: string, backendUrl: string) {
        this._panel.webview.postMessage({ type: 'loading' });
        const [baselineRes, smeRes] = await Promise.allSettled([
            this._callAPI(backendUrl, message, plugId, 'baseline', apiKey),
            this._callAPI(backendUrl, message, plugId, 'sme', apiKey),
        ]);
        this._panel.webview.postMessage({
            type: 'results',
            baseline: baselineRes.status === 'fulfilled' ? baselineRes.value : { error: String((baselineRes as any).reason) },
            sme: smeRes.status === 'fulfilled' ? smeRes.value : { error: String((smeRes as any).reason) },
        });
    }

    private async _callAPI(backendUrl: string, message: string, plugId: string, mode: string, apiKey: string) {
        const res = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || 'dev-test-key-123' },
            body: JSON.stringify({ message, plug_id: plugId, mode }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    private _getHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SME-Plug Compare</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background:#0d1117; color:#e6edf3; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:13px; height:100vh; display:flex; flex-direction:column; overflow:hidden; }
.topbar { background:#161b22; border-bottom:1px solid #30363d; padding:10px 16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.logo { font-family:'Courier New',monospace; font-weight:700; font-size:15px; color:#f0f0f0; }
.logo span { color:#a3e635; }
.config-group { display:flex; align-items:center; gap:8px; margin-left:auto; }
input, select { background:#0d1117; border:1px solid #30363d; color:#e6edf3; padding:5px 10px; font-size:12px; font-family:'Courier New',monospace; border-radius:4px; }
input:focus, select:focus { outline:none; border-color:#a3e635; }
#apiKeyInput { width:240px; }
.labels { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:#30363d; border-bottom:1px solid #30363d; }
.label { padding:8px 16px; font-size:11px; font-weight:700; letter-spacing:0.08em; display:flex; align-items:center; gap:8px; }
.label-baseline { background:#1a0a0a; color:#f85149; border-right:1px solid #30363d; }
.label-sme { background:#0a1a0a; color:#3fb950; }
.label-badge { padding:2px 8px; border-radius:3px; font-size:10px; font-family:'Courier New',monospace; }
.badge-danger  { background:rgba(248,81,73,0.15);  color:#f85149; border:1px solid rgba(248,81,73,0.3); }
.badge-success { background:rgba(63,185,80,0.15);  color:#3fb950; border:1px solid rgba(63,185,80,0.3); }
.badge-warning { background:rgba(210,153,34,0.15); color:#d29922; border:1px solid rgba(210,153,34,0.3); }
.panes { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:#30363d; flex:1; overflow:hidden; }
.pane { background:#0d1117; padding:16px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; }
.pane-baseline { border-right:2px solid rgba(248,81,73,0.3); }
.pane-sme      { border-left:2px solid rgba(63,185,80,0.3); }
.placeholder { color:#484f58; font-style:italic; font-size:12px; line-height:1.6; }
.response-block { background:#161b22; border:1px solid #30363d; border-radius:6px; padding:14px; line-height:1.65; white-space:pre-wrap; font-size:13px; }
.response-block.baseline-block { border-left:3px solid #f85149; }
.response-block.sme-block { border-left:3px solid #3fb950; }
.response-block.blocked-block { border-left:3px solid #d29922; }
.citation-chip { display:inline-block; background:rgba(210,153,34,0.12); border:1px solid rgba(210,153,34,0.35); color:#d29922; border-radius:3px; padding:1px 7px; font-size:11px; font-family:'Courier New',monospace; margin:2px 3px 2px 0; }
.citations-row { display:flex; flex-wrap:wrap; gap:4px; padding-top:4px; }
.verified-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(63,185,80,0.1); border:1px solid rgba(63,185,80,0.3); color:#3fb950; border-radius:4px; padding:4px 10px; font-size:11px; font-family:'Courier New',monospace; font-weight:700; }
.warning-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(248,81,73,0.1); border:1px solid rgba(248,81,73,0.3); color:#f85149; border-radius:4px; padding:4px 10px; font-size:11px; font-family:'Courier New',monospace; }
.guardrail-banner { background:rgba(210,153,34,0.1); border:1px solid rgba(210,153,34,0.4); color:#d29922; padding:10px 14px; border-radius:4px; font-family:'Courier New',monospace; font-size:12px; font-weight:700; }
.loading-dots span { display:inline-block; width:6px; height:6px; background:#484f58; border-radius:50%; margin:0 2px; animation:bounce 1.2s infinite; }
.loading-dots span:nth-child(2) { animation-delay:0.2s; }
.loading-dots span:nth-child(3) { animation-delay:0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }
.plug-indicator { display:flex; align-items:center; gap:6px; font-family:'Courier New',monospace; font-size:11px; }
.plug-dot { width:8px; height:8px; border-radius:50%; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.input-bar { background:#161b22; border-top:1px solid #30363d; padding:12px 16px; display:flex; gap:8px; }
#queryInput { flex:1; padding:8px 12px; font-size:13px; background:#0d1117; border:1px solid #30363d; color:#e6edf3; border-radius:4px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
#queryInput:focus { outline:none; border-color:#a3e635; }
#sendBtn { background:#a3e635; color:#0d1117; border:none; padding:8px 20px; font-weight:700; font-size:13px; border-radius:4px; cursor:pointer; font-family:'Courier New',monospace; letter-spacing:0.04em; transition:opacity 0.15s; }
#sendBtn:hover { opacity:0.85; }
#sendBtn:disabled { opacity:0.4; cursor:not-allowed; }
</style>
</head>
<body>
<div class="topbar">
  <div class="logo">sme<span>plug</span></div>
  <div class="plug-indicator">
    <div class="plug-dot" id="plugDot" style="background:#60a5fa"></div>
    <span id="plugLabel" style="color:#60a5fa;font-family:'Courier New',monospace;font-size:11px">Legal SME</span>
  </div>
  <div class="config-group">
    <select id="plugSelect">
      <option value="legal">⚖ Legal</option>
      <option value="healthcare">⚕ Healthcare</option>
      <option value="engineering">⚙ Engineering</option>
    </select>
    <input id="apiKeyInput" type="password" placeholder="sme_live_... (paste API key)" />
    <input id="backendUrl" type="text" value="http://localhost:8000" style="width:180px" />
  </div>
</div>

<div class="labels">
  <div class="label label-baseline">
    <span>❌ BASELINE LLM</span>
    <span class="label-badge badge-danger">No Plugin — Unguarded</span>
  </div>
  <div class="label label-sme">
    <span>✅ SME-PLUG</span>
    <span class="label-badge badge-success" id="smePlugName">Legal Expert Active</span>
    <span class="label-badge badge-success" id="smeVerified" style="display:none">✓ Verified</span>
  </div>
</div>

<div class="panes">
  <div class="pane pane-baseline" id="baselinePane">
    <div class="placeholder">The baseline LLM will appear here — no system prompt, no persona, no guardrails.

It will answer confidently. It may fabricate citations, hallucinate page numbers, or state incorrect facts with full confidence.

That is the problem SME-Plug solves.</div>
  </div>
  <div class="pane pane-sme" id="smePane">
    <div class="placeholder">The SME-Plug expert response will appear here.

Every factual claim will include [Source: document, pg X].
If no source document exists for the query, it will say so — it will never fabricate one.

That is the product.</div>
  </div>
</div>

<div class="input-bar">
  <input id="queryInput" type="text" placeholder='Try: "What are the penalties under GDPR Article 83?" or "What is the load factor for W18x35 steel beams?"' />
  <button id="sendBtn">ASK BOTH →</button>
</div>

<script>
const vscode = acquireVsCodeApi();
const PLUG_COLORS = { legal:'#60a5fa', healthcare:'#34d399', engineering:'#fbbf24' };
const PLUG_NAMES  = { legal:'Legal Expert Active', healthcare:'Healthcare Expert Active', engineering:'Engineering Expert Active' };

vscode.postMessage({ type: 'getConfig' });

window.addEventListener('message', e => {
  const msg = e.data;
  if (msg.type === 'config') {
    document.getElementById('apiKeyInput').value = msg.apiKey || '';
    document.getElementById('plugSelect').value  = msg.pluginId || 'legal';
    document.getElementById('backendUrl').value  = msg.backendUrl || 'http://localhost:8000';
    updatePlug(msg.pluginId || 'legal');
  }
  if (msg.type === 'loading') showLoading();
  if (msg.type === 'results') showResults(msg.baseline, msg.sme);
});

document.getElementById('plugSelect').addEventListener('change', e => updatePlug(e.target.value));

function updatePlug(plugId) {
  const c = PLUG_COLORS[plugId] || '#888';
  document.getElementById('plugDot').style.background  = c;
  document.getElementById('plugLabel').style.color     = c;
  document.getElementById('plugLabel').textContent     = PLUG_NAMES[plugId]?.replace(' Active','') || plugId;
  document.getElementById('smePlugName').textContent   = PLUG_NAMES[plugId] || plugId;
}

function showLoading() {
  const dots = '<div class="loading-dots" style="padding:12px 0"><span></span><span></span><span></span></div>';
  document.getElementById('baselinePane').innerHTML = '<div class="placeholder">Calling baseline LLM...</div>' + dots;
  document.getElementById('smePane').innerHTML      = '<div class="placeholder">Calling SME-Plug expert...</div>' + dots;
  document.getElementById('sendBtn').disabled = true;
  document.getElementById('smeVerified').style.display = 'none';
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>');
}

function showResults(baseline, sme) {
  document.getElementById('sendBtn').disabled = false;

  // BASELINE
  const bPane = document.getElementById('baselinePane');
  if (baseline.error) {
    bPane.innerHTML = '<div class="warning-badge">Error connecting to backend — is it running?</div>';
  } else {
    bPane.innerHTML =
      '<div class="warning-badge">⚠ No citations — this response is unverified</div>' +
      '<div class="response-block baseline-block">' + esc(baseline.response) + '</div>' +
      (!baseline.has_citations ? '<div class="warning-badge">This response may contain hallucinated facts. Zero sources cited.</div>' : '');
  }

  // SME
  const sPane = document.getElementById('smePane');
  if (sme.error) {
    sPane.innerHTML = '<div class="warning-badge">Error: ' + esc(sme.error) + '</div>';
  } else if (sme.guardrail_fired) {
    sPane.innerHTML =
      '<div class="guardrail-banner">⚑ BLOCKED BY GUARDRAIL — Manipulation attempt detected and logged</div>' +
      '<div class="response-block blocked-block">' + esc(sme.response) + '</div>';
  } else {
    const chips = (sme.citations||[]).map(c => '<span class="citation-chip">📎 ' + esc(c) + '</span>').join('');
    sPane.innerHTML =
      (sme.has_citations
        ? '<div class="verified-badge">✓ All claims verified — sources cited</div>'
        : '<div class="warning-badge">⚠ No documents found — upload docs to knowledge base</div>') +
      '<div class="response-block sme-block">' + esc(sme.response) + '</div>' +
      (chips ? '<div class="citations-row">' + chips + '</div>' : '');
    if (sme.has_citations) document.getElementById('smeVerified').style.display = 'inline-block';
  }
}

document.getElementById('sendBtn').addEventListener('click', send);
document.getElementById('queryInput').addEventListener('keydown', e => { if(e.key==='Enter') send(); });

function send() {
  const message    = document.getElementById('queryInput').value.trim();
  const plugId     = document.getElementById('plugSelect').value;
  const apiKey     = document.getElementById('apiKeyInput').value.trim();
  const backendUrl = document.getElementById('backendUrl').value.trim();
  if (!message) return;
  vscode.postMessage({ type:'query', message, plugId, apiKey, backendUrl });
}
</script>
</body>
</html>`;
    }

    public dispose() {
        ComparePanel.currentPanel = undefined;
        this._panel.dispose();
        this._disposables.forEach(d => d.dispose());
    }
}
