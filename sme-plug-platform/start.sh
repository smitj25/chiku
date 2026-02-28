#!/bin/bash
# start.sh — boots the full SME-Plug stack
# Run: bash start.sh

set -e

echo ""
echo "════════════════════════════════════════"
echo "  SME-Plug  |  Dev Stack Start"
echo "════════════════════════════════════════"
echo ""

# ── CHECK .env ────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "✗  .env not found — copy .env and fill in your keys"
  exit 1
fi

if grep -q "your_anthropic_key_here" .env; then
  echo "✗  Fill in ANTHROPIC_API_KEY in .env first"
  exit 1
fi

if grep -q "your_supabase_project_url" .env; then
  echo "✗  Fill in SUPABASE_URL in .env first"
  exit 1
fi

echo "✓  .env looks configured"

# ── CHECK PYTHON DEPS ─────────────────────────────────────────────────────────
echo ""
echo "Checking Python dependencies..."
python3 -c "import fastapi, anthropic, chromadb, sentence_transformers, supabase" 2>/dev/null || {
  echo ""
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
}
echo "✓  Python deps ready"

# ── MAKE SURE DATA DIRS EXIST ─────────────────────────────────────────────────
mkdir -p data/docs/engineering data/docs/legal data/docs/healthcare data/chroma

# ── CHECK FOR DOCS ────────────────────────────────────────────────────────────
echo ""
ENGINEERING_DOCS=$(ls data/docs/engineering/*.pdf 2>/dev/null | wc -l)
if [ "$ENGINEERING_DOCS" -eq 0 ]; then
  echo "⚠  No PDFs in data/docs/engineering/"
  echo "   Drop any engineering/structural PDF there, then run:"
  echo "   python -m backend.rag.ingestor engineering"
  echo ""
else
  echo "✓  Found $ENGINEERING_DOCS PDF(s) in engineering docs"

  # Check if already ingested
  if [ ! -d "data/chroma" ] || [ -z "$(ls -A data/chroma 2>/dev/null)" ]; then
    echo "Ingesting documents into ChromaDB..."
    python3 -m backend.rag.ingestor
  else
    echo "✓  ChromaDB already has data (run 'python -m backend.rag.ingestor' to re-index)"
  fi
fi

# ── START FASTAPI ─────────────────────────────────────────────────────────────
echo ""
echo "Starting FastAPI backend on http://localhost:8000 ..."
echo "════════════════════════════════════════"
echo ""
uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0
