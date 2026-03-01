# tether

Official Python SDK for [Tether](https://tether.dev) — AI expert plugins with verified citations.

## Install

```bash
pip install tether
```

## Quick Start

```python
from tether import Tether

plug = Tether(api_key="tether_live_xxx", plugin_id="legal-v1")

response = plug.chat("What are the GDPR penalties for non-compliance?")

print(response.text)        # Cited analysis
print(response.citations)   # [Citation(source="GDPR_Text.pdf", page=47)]
print(response.verified)    # True
print(response.ragas_score) # 0.93
```

## Context Manager

```python
with Tether(api_key="tether_live_xxx", plugin_id="legal-v1") as plug:
    res = plug.chat("Analyze clause 4.2")
    print(res.text)
```

## Upload Documents

```python
plug.upload("contracts/vendor_agreement.pdf")
plug.reindex()
```

## RAGAS Evaluation

```python
scores = plug.evaluate()
print(scores.faithfulness)       # 0.93
print(scores.answer_relevancy)   # 0.91
print(scores.context_precision)  # 0.89
print(scores.overall)            # 0.91
```

## Error Handling

```python
from tether import Tether, TetherError

try:
    res = plug.chat("query")
except TetherError as e:
    print(e.code)    # 'INVALID_KEY' | 'RATE_LIMITED' | 'API_ERROR'
    print(e.status)  # 401 | 429 | etc.
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
