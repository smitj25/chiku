# SME-Plug JetBrains Plugin

AI expert plugins with verified citations — for IntelliJ IDEA, WebStorm, PyCharm, and all JetBrains IDEs.

## Features

- **Tool Window Chat** — Chat with your SME expert in the sidebar
- **Context Menu** — Right-click selected code → "Ask SME-Plug About Selection"
- **Settings Panel** — Configure API key and plugin under Settings → Tools → SME-Plug
- **Status Bar** — Shows active plugin and connection status

## Setup

1. Install from JetBrains Marketplace
2. Go to **Settings → Tools → SME-Plug**
3. Enter your API key from [smeplug.dev/api-keys](https://smeplug.dev/api-keys)
4. Select your plugin (Legal, Healthcare, Engineering, etc.)
5. Open the **SME-Plug** tool window on the right sidebar

## Development

### Prerequisites
- IntelliJ IDEA 2023.2+
- JDK 17+

### Build & Run
```bash
cd packages/jetbrains-plugin
./gradlew buildPlugin         # Build the plugin
./gradlew runIde              # Launch IDE with plugin loaded
./gradlew publishPlugin       # Publish to JetBrains Marketplace
```

## Structure

```
src/main/kotlin/dev/smeplug/jetbrains/
├── SMEPlugToolWindowFactory.kt    # Tool window registration
├── SMEPlugClient.kt               # HTTP API client
├── settings/
│   ├── SMEPlugSettings.kt         # Persistent settings
│   └── SMEPlugConfigurable.kt     # Settings UI
└── ui/
    └── ChatPanel.kt               # Chat panel UI
```
