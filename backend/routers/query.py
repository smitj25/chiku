"""Query router — Main query endpoint with comparison mode."""
from fastapi import APIRouter, HTTPException
from models.schemas import QueryRequest, QueryResponse, ComparisonResponse
from services.pipeline import process_query

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse | ComparisonResponse)
async def query(request: QueryRequest):
    """
    Process a query through the SME-Plug pipeline.
    
    - Runs input guardrails → retrieval → LLM → citation verification → output guardrails
    - If compare_mode=true, also returns a vanilla LLM response for side-by-side comparison
    """
    try:
        result = await process_query(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
