import * as vscode from "vscode";
import { SMEPlugClient } from "./client.js";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private sessionId?: string;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly client: SMEPlugClient
  ) { }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "chat":
          await this.handleChat(message.text);
          break;
        case "clear":
          this.sessionId = undefined;
          break;
      }
    });
  }

  async sendMessage(text: string) {
    if (this.view) {
      this.view.show(true);
      // Add user message to UI
      this.view.webview.postMessage({ type: "userMessage", text });
    }
    await this.handleChat(text);
  }

  private async handleChat(text: string) {
    if (!this.client.isConfigured()) {
      this.view?.webview.postMessage({
        type: "error",
        text: 'API key not set. Run command "SME-Plug: Set API Key".',
      });
      return;
    }

    this.view?.webview.postMessage({ type: "loading", loading: true });

    try {
      const response = await this.client.chat(text, this.sessionId);
      this.sessionId = response.session_id;

      this.view?.webview.postMessage({
        type: "response",
        text: response.response,
        citations: response.citations,
        verified: response.verified,
        score: response.ragas_score,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      this.view?.webview.postMessage({ type: "error", text: errorMessage });
    } finally {
      this.view?.webview.postMessage({ type: "loading", loading: false });
    }
  }

  private getHtmlContent(): string {
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      display: flex; flex-direction: column; height: 100vh;
    }
    #chat {
      flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;
    }
    .msg { padding: 8px 12px; border-radius: 8px; font-size: 13px; line-height: 1.5; max-width: 90%; word-wrap: break-word; }
    .msg.user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); align-self: flex-end; }
    .msg.assistant { background: var(--vscode-editor-inactiveSelectionBackground); align-self: flex-start; }
    .msg.error { background: var(--vscode-inputValidation-errorBackground); border: 1px solid var(--vscode-inputValidation-errorBorder); align-self: flex-start; }
    .citations { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--vscode-widget-border); font-size: 11px; opacity: 0.7; }
    .citation { margin: 2px 0; }
    .score { display: inline-block; background: #a3e635; color: #000; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; margin-top: 4px; }
    .verified { color: #a3e635; font-size: 11px; }
    #loading { display: none; padding: 12px; text-align: center; font-size: 12px; opacity: 0.6; }
    #loading.active { display: block; }
    #input-area { padding: 8px; border-top: 1px solid var(--vscode-widget-border); display: flex; gap: 6px; }
    #input {
      flex: 1; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 6px 10px; font-size: 13px;
      font-family: var(--vscode-font-family); resize: none; outline: none; min-height: 34px; max-height: 100px;
    }
    #input:focus { border-color: var(--vscode-focusBorder); }
    #send {
      background: var(--vscode-button-background); color: var(--vscode-button-foreground);
      border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 600;
    }
    #send:hover { background: var(--vscode-button-hoverBackground); }
    .welcome { text-align: center; padding: 30px 16px; opacity: 0.6; font-size: 12px; }
    .welcome h3 { margin-bottom: 8px; font-size: 14px; }
  </style>
</head>
<body>
  <div id="chat">
    <div class="welcome">
      <h3>🔌 SME-Plug</h3>
      <p>Ask your domain expert anything.<br>Responses include verified citations.</p>
    </div>
  </div>
  <div id="loading">Thinking...</div>
  <div id="input-area">
    <textarea id="input" rows="1" placeholder="Ask your SME expert..."></textarea>
    <button id="send">Send</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const loading = document.getElementById('loading');

    function addMsg(cls, html) {
      const welcome = chat.querySelector('.welcome');
      if (welcome) welcome.remove();
      const div = document.createElement('div');
      div.className = 'msg ' + cls;
      div.innerHTML = html;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    document.getElementById('send').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMsg('user', text);
      vscode.postMessage({ type: 'chat', text });
      input.value = '';
    }

    window.addEventListener('message', (e) => {
      const msg = e.data;
      switch (msg.type) {
        case 'userMessage': addMsg('user', msg.text); break;
        case 'response': {
          let html = msg.text;
          if (msg.citations?.length) {
            html += '<div class="citations">';
            msg.citations.forEach(c => { html += '<div class="citation">📄 ' + c.source + ' (p.' + c.page + ')</div>'; });
            html += '</div>';
          }
          if (msg.verified) html += ' <span class="verified">✓ Verified</span>';
          if (msg.score) html += ' <span class="score">RAGAS ' + msg.score.toFixed(2) + '</span>';
          addMsg('assistant', html);
          break;
        }
        case 'error': addMsg('error', '⚠ ' + msg.text); break;
        case 'loading': loading.className = msg.loading ? 'active' : ''; break;
      }
    });
  </script>
</body>
</html>`;
  }
}
