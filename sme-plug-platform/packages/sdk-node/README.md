# @smeplug/sdk

Official Node.js SDK for [SME-Plug](https://smeplug.dev) — AI expert plugins with verified citations.

## Install

```bash
npm install @smeplug/sdk
```

## Quick Start

```typescript
import { SMEPlug } from '@smeplug/sdk'

const plug = new SMEPlug({
  apiKey: process.env.SME_API_KEY!,
  pluginId: 'legal-v1',
})

const response = await plug.chat('What are the GDPR penalties for non-compliance?')

console.log(response.text)        // Cited analysis
console.log(response.citations)   // [{ source: "GDPR_Text.pdf", page: 47 }]
console.log(response.verified)    // true
console.log(response.ragasScore)  // 0.93
```

## Available Plugins

| Plugin ID | Domain |
|---|---|
| `legal-v1` | Compliance & Contracts |
| `healthcare-v1` | Clinical & Compliance |
| `engineering-v1` | Structural & Safety |
| `finance-v1` | Banking & Risk |
| `education-v1` | Curriculum & Assessment |
| `cyber-v1` | Threat & Compliance |

## API

### `new SMEPlug(options)`
- `apiKey` — Your API key (`sme_live_xxx`)
- `pluginId` — Plugin to use
- `baseUrl` — API URL (default: `https://api.smeplug.dev`)
- `timeout` — Request timeout in ms (default: `30000`)

### `plug.chat(message, options?)`
Send a query. Returns `{ text, citations, verified, ragasScore, sessionId }`.

### `plug.upload(file, filename)`
Upload a document to the knowledge base.

### `plug.reindex()`
Re-index the knowledge base after uploading documents.

### `plug.evaluate()`
Get RAGAS scores: `{ faithfulness, answerRelevancy, contextPrecision, overall }`.

### `plug.clearSession()`
Clear session to start a new conversation.

## Error Handling

```typescript
import { SMEPlug, SMEPlugError } from '@smeplug/sdk'

try {
  const res = await plug.chat('query')
} catch (err) {
  if (err instanceof SMEPlugError) {
    console.log(err.code)    // 'INVALID_KEY' | 'RATE_LIMITED' | 'API_ERROR'
    console.log(err.status)  // 401 | 429 | etc.
  }
}
```
