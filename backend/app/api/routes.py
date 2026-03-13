"""FastAPI routes for backtests, strategy generation, and health."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.strategy import ParseRequest, BacktestRequest
from app.models.result import BacktestResult
from app.agents.supervisor import run_full_pipeline
from app.agents.generator import generate_and_backtest

router = APIRouter()

# In-memory store for results (MVP — no persistent DB needed)
_results: dict[str, BacktestResult] = {}


class GenerateRequest(BaseModel):
    """Request to generate an optimal strategy via CrewAI."""
    goal: str
    symbol: str = "AAPL"
    lookback: str = "2y"


@router.post("/api/backtest", response_model=BacktestResult)
async def create_backtest(req: BacktestRequest):
    """Run the full agentic pipeline and return results."""
    parse_req = ParseRequest(
        strategy_text=req.strategy_text,
        symbol=req.symbol,
        timeframe=req.timeframe,
        lookback=req.lookback,
        macro_shield_enabled=req.macro_shield_enabled,
    )
    result = run_full_pipeline(parse_req)

    if result.status == "failed":
        _results[result.run_id] = result
        return result

    _results[result.run_id] = result
    return result


@router.post("/api/generate", response_model=BacktestResult)
async def generate_strategy(req: GenerateRequest):
    """Generate an optimal strategy via CrewAI agents and backtest it."""
    result = generate_and_backtest(
        goal=req.goal,
        symbol=req.symbol,
        lookback=req.lookback,
    )
    _results[result.run_id] = result
    return result


@router.get("/api/backtest/{run_id}", response_model=BacktestResult)
async def get_backtest(run_id: str):
    """Retrieve a previous backtest result."""
    if run_id not in _results:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return _results[run_id]


@router.get("/api/health")
async def health():
    """Health check endpoint."""
    from app.core.config import settings
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "llm_configured": bool(settings.GROQ_API_KEY),
    }
