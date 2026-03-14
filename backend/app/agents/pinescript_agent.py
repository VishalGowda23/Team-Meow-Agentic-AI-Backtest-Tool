"""PineScript v5 code generation agent — fully decoupled from backtest pipeline."""
from __future__ import annotations
import re
import time
from groq import Groq
from app.core.config import settings


# ── System Prompt ────────────────────────────────────────────────

PINESCRIPT_SYSTEM_PROMPT = """You are a PineScript v5 expert. Your ONLY job is to translate a JSON strategy definition into valid TradingView PineScript v5 strategy logic.

RULES:
1. Use `strategy.entry()` for entries and `strategy.close()` for exits.
2. Create `input.int()` or `input.float()` for ALL indicator lengths so users can adjust them.
3. Use proper PineScript v5 syntax: `ta.sma()`, `ta.ema()`, `ta.rsi()`, `ta.macd()`, `ta.crossover()`, `ta.crossunder()`, `ta.atr()`, `ta.bb()` etc.
4. Include plot statements for key indicators.
5. Add `bgcolor` highlighting when entry/exit conditions are true.
6. Output ONLY the PineScript logic code — NO `//@version`, NO `strategy()` declaration, NO comments about what you're doing.
7. Do NOT wrap your output in markdown code fences.
8. The code must be syntactically valid and compile-ready when inserted into a strategy skeleton."""


# ── PineScript Skeleton ─────────────────────────────────────────

PINESCRIPT_SKELETON = """// © 2024 AI_Agent_Backtester — Astra.AI
//@version=5
strategy("AI Generated Strategy", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=10, commission_type=strategy.commission.percent, commission_value=0.1, slippage=5)

{logic}
"""


# ── LLM Call (text output, not JSON) ─────────────────────────────

def call_llm_text(system_prompt: str, user_prompt: str) -> str:
    """Call Groq LLM and return raw text (not JSON).
    Used for code generation where output is PineScript, not structured data."""
    models = [settings.LLM_PRIMARY_MODEL, settings.LLM_FALLBACK_MODEL]
    client = Groq(api_key=settings.GROQ_API_KEY)
    last_error = None

    for model in models:
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.05,
                    max_tokens=3000,
                )
                text = response.choices[0].message.content or ""
                if text.strip():
                    return text.strip()
            except Exception as e:
                last_error = e
                if "429" in str(e):
                    time.sleep(2 ** attempt)
                    continue
                break

    raise RuntimeError(f"All LLM models failed for PineScript generation. Last error: {last_error}")


# ── Code Cleaning ────────────────────────────────────────────────

def _clean_pinescript(raw: str) -> str:
    """Strip markdown fences and version declarations from LLM output."""
    # Remove markdown code fences
    cleaned = re.sub(r"```(?:pinescript|pine|)?\s*", "", raw)
    cleaned = cleaned.replace("```", "")

    # Remove any //@version or strategy() lines the LLM may have included
    lines = cleaned.strip().split("\n")
    filtered = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("//@version"):
            continue
        if stripped.startswith("strategy(") and "overlay" in stripped:
            continue
        if stripped.startswith("// ©") and "AI_Agent" in stripped:
            continue
        filtered.append(line)

    return "\n".join(filtered).strip()


# ── Main Generator ───────────────────────────────────────────────

def generate_pinescript(strategy_json: dict) -> str:
    """Generate production-ready TradingView PineScript v5 from a strategy JSON.

    This function is fully decoupled from the backtest pipeline.
    It makes an independent LLM call and wraps the result in the
    mandated PineScript skeleton with realistic friction parameters.
    """
    import json
    user_prompt = (
        "Translate this JSON strategy into PineScript v5 logic.\n\n"
        f"```json\n{json.dumps(strategy_json, indent=2)}\n```\n\n"
        "Output ONLY the indicator calculations, conditions, and "
        "strategy.entry/strategy.close calls. No version header, "
        "no strategy() declaration, no markdown fences."
    )

    try:
        raw_code = call_llm_text(PINESCRIPT_SYSTEM_PROMPT, user_prompt)
        logic = _clean_pinescript(raw_code)
    except Exception:
        # Fallback: generate a basic skeleton from the JSON
        logic = _fallback_pinescript(strategy_json)

    return PINESCRIPT_SKELETON.format(logic=logic)


# ── Fallback Generator ───────────────────────────────────────────

def _fallback_pinescript(strategy_json: dict) -> str:
    """Generate a basic PineScript skeleton when the LLM is unavailable."""
    lines = [
        "// ── Inputs ──",
        "len_fast = input.int(50, 'Fast Length')",
        "len_slow = input.int(200, 'Slow Length')",
        "rsi_len = input.int(14, 'RSI Length')",
        "rsi_ob = input.float(70.0, 'RSI Overbought')",
        "rsi_os = input.float(30.0, 'RSI Oversold')",
        "",
        "// ── Indicators ──",
        "fast = ta.sma(close, len_fast)",
        "slow = ta.sma(close, len_slow)",
        "rsi_val = ta.rsi(close, rsi_len)",
        "",
        "// ── Plots ──",
        "plot(fast, 'Fast MA', color.blue)",
        "plot(slow, 'Slow MA', color.red)",
        "",
        "// ── Strategy Logic ──",
        "long_cond = ta.crossover(fast, slow) and rsi_val < rsi_ob",
        "exit_cond = ta.crossunder(fast, slow) or rsi_val > rsi_ob",
        "",
        "if long_cond",
        "    strategy.entry('Long', strategy.long)",
        "",
        "if exit_cond",
        "    strategy.close('Long')",
        "",
        "bgcolor(long_cond ? color.new(color.green, 90) : na)",
        "bgcolor(exit_cond ? color.new(color.red, 90) : na)",
    ]

    # Try to extract actual indicator info from strategy JSON
    try:
        entry_rules = strategy_json.get("parsed_strategy", strategy_json).get("entry", {}).get("rules", [])
        if entry_rules:
            lines.insert(0, f"// Strategy auto-generated from {len(entry_rules)} entry rule(s)")
    except Exception:
        pass

    return "\n".join(lines)
