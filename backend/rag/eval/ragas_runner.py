"""
ragas_runner.py — Runs RAGAS evaluation (Faithfulness + Context Precision)
against the golden_dataset.json Q&A pairs.

Usage: python -m backend.rag.eval.ragas_runner
Target: Faithfulness > 0.90
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path

from backend.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

GOLDEN_DATASET_PATH = Path(__file__).parent / "golden_dataset.json"


async def run_ragas_eval():
    try:
        from ragas import evaluate
        from ragas.metrics import faithfulness, context_precision, context_recall
        from datasets import Dataset
        import anthropic
    except ImportError as e:
        logger.error(f"Missing dependency: {e}. Run: pip install ragas datasets")
        return

    # Load golden dataset
    if not GOLDEN_DATASET_PATH.exists():
        logger.error(f"Golden dataset not found: {GOLDEN_DATASET_PATH}")
        return

    with open(GOLDEN_DATASET_PATH) as f:
        golden = json.load(f)

    # Build answers using the live API
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    from backend.rag.retriever import Retriever
    from backend.rag.vectorstore import get_chroma_client
    from backend.core.context_engine import ContextEngine
    from backend.core.tool_injector import ToolInjector
    from backend.agents.base_agent import SMEAgent
    from backend.core.state_manager import StateManager, SessionState

    chroma = get_chroma_client()
    retriever = Retriever(chroma)
    ctx_engine = ContextEngine()
    tool_injector = ToolInjector()
    state_mgr = StateManager()

    # Load plug configs
    import json as _json
    plugs_dir = Path(settings.plugs_config_dir)
    plug_configs = {}
    for pf in plugs_dir.glob("*.json"):
        cfg = _json.loads(pf.read_text())
        plug_configs[cfg["plug_id"]] = cfg

    questions, answers, ground_truths, contexts_list = [], [], [], []

    for item in golden:
        q = item["question"]
        gt = item["ground_truth"]
        plug_name = item.get("plug", "engineering_sme")
        plug_cfg = plug_configs.get(plug_name, plug_configs.get("engineering_sme"))

        session = state_mgr.get_or_create(f"eval-{hash(q)}", plug_name)
        chunks = await retriever.get_chunks(q, plug_cfg["chroma_namespace"])
        tools = tool_injector.get_tools_for_plug(plug_cfg)
        system_prompt = ctx_engine.build_system_prompt(session, plug_cfg, chunks, tools)

        agent = SMEAgent(plug_cfg, tools, client)
        try:
            reply, _ = await agent.run(q, session, system_prompt)
        except Exception as e:
            reply = f"Error: {e}"
            logger.error(f"Agent error for question '{q[:50]}': {e}")

        questions.append(q)
        answers.append(reply)
        ground_truths.append(gt)
        contexts_list.append([c["text"] for c in chunks] if chunks else ["No context retrieved."])

    # Build RAGAS dataset
    dataset = Dataset.from_dict({
        "question": questions,
        "answer": answers,
        "ground_truth": ground_truths,
        "contexts": contexts_list,
    })

    logger.info("Running RAGAS evaluation...")
    result = evaluate(
        dataset,
        metrics=[faithfulness, context_precision, context_recall],
    )

    df = result.to_pandas()
    print("\n" + "=" * 60)
    print("RAGAS EVALUATION RESULTS")
    print("=" * 60)
    print(df[["question", "faithfulness", "context_precision", "context_recall"]].to_string(index=False))
    print("\nSummary:")
    print(f"  Faithfulness:      {df['faithfulness'].mean():.4f}  (target > 0.90)")
    print(f"  Context Precision: {df['context_precision'].mean():.4f}")
    print(f"  Context Recall:    {df['context_recall'].mean():.4f}")
    print("=" * 60)

    # Save results
    out_path = Path(__file__).parent / "ragas_results.json"
    result_dict = {
        "faithfulness": round(df["faithfulness"].mean(), 4),
        "context_precision": round(df["context_precision"].mean(), 4),
        "context_recall": round(df["context_recall"].mean(), 4),
        "per_question": df.to_dict(orient="records"),
    }
    out_path.write_text(json.dumps(result_dict, indent=2))
    logger.info(f"Results saved to {out_path}")

    return result_dict


if __name__ == "__main__":
    asyncio.run(run_ragas_eval())
