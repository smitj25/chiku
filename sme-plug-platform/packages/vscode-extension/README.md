# SME-Plug VS Code Extension

AI expert plugins with verified citations — right inside your editor.

## Features

- **Sidebar Chat Panel** — Ask your SME expert questions directly in VS Code
- **Context Menu** — Right-click selected code → "Ask SME-Plug About Selection"
- **Status Bar** — Shows active plugin and connection status
- **Citations** — Every response includes verified source references
- **RAGAS Score** — See the faithfulness score for each response

## Setup

1. Install from VS Code Marketplace (or `code --install-extension smeplug-vscode`)
2. Get your API key at [smeplug.dev/api-keys](https://smeplug.dev/api-keys)
3. Run `SME-Plug: Set API Key` from the Command Palette
4. Select your plugin with `SME-Plug: Select Plugin`

## Configuration

```json
// settings.json
{
  "smeplug.apiKey": "sme_live_xxxxxxxxxxxx",
  "smeplug.pluginId": "legal-v1",
  "smeplug.apiUrl": "https://api.smeplug.dev",
  "smeplug.streamResponses": true
}
```

## Commands

| Command | Description |
|---|---|
| `SME-Plug: Ask SME` | Open input box to ask a question |
| `SME-Plug: Ask About Selection` | Ask about selected text |
| `SME-Plug: Set API Key` | Configure your API key |
| `SME-Plug: Select Plugin` | Switch between SME plugins |

## Development

```bash
cd packages/vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```
