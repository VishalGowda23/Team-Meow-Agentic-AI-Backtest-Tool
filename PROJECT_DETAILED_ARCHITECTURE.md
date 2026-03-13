# Astra / Astra AI: Complete Architecture and Feature Guide

This document explains the full project in detail: what features exist, how each module works, how agents are linked, how data moves end-to-end, and how final outputs are generated.

## 💡 Why Astra? (The Core Problem solved)

Traditionally, backtesting a trading idea requires serious technical skills. A trader must:
1. Find, clean, and normalize historical datasets.
2. Code complex mathematical arrays in Python/Pandas to calculate indicators like RSI and MACD.
3. Build a precise simulation loop that accurately models buying, selling, stop losses, slippage, and commissions without introducing "lookahead bias" (peeking into the future).
4. Calculate rigorous quantitative metrics (Sharpe ratio, Max Drawdown) to prove the strategy works.

**Astra automates all of this in three seconds.** You type: *"Buy when the 50 SMA crosses above the 200 SMA"*. The AI parses the math, fetches the data, runs the simulation, and hands you an institutional-grade performance report.

## 🍔 The "High-End Restaurant" Analogy (How it Works)
To understand Astra's architecture, imagine a high-end restaurant:
* **The Manager (CrewAI / Parsing Agents)**: You tell the manager what kind of meal you want ("I want a low-risk strategy"). The manager listens, uses their creativity, and finalizes a strict, written *recipe* (The JSON `StrategySchema`).
* **The Ingredients (Data Adapters)**: The kitchen staff fetches fresh ingredients (Historical Stock OHLCV data).
* **The Chef (Compiler & Execution Engine)**: A strict, emotionless machine reads the recipe and cooks the exact meals day-by-day based *strictly* on the recipe. The Chef does not invent, guess, or hallucinate.
* **The Food Critic (Analytics Agent)**: Tastes the final outcome and scores it across 12 different metrics (Sharpe, Drawdown, Profit Factor), returning a brutally honest review to you.

By intentionally separating the **Creative Manager** from the **Strict Chef**, Astra guarantees that the ideas are highly innovative, but the backtest results are mathematically bulletproof and safe from AI hallucinations.

---

## 1) What This Project Is

Astra (UI branding also shows Astra AI) is an AI-assisted trading strategy backtesting platform with two user modes:

1. Manual Backtest Mode
User writes a strategy in natural language. The system parses it into a strict strategy schema, compiles signals, runs a deterministic backtest, and produces metrics/charts/trades.

2. Generate Strategy Mode
User writes a goal (for example: maximize returns with low drawdown). A CrewAI multi-agent team proposes strategy rules, those rules are normalized into the same strict schema, and then the same deterministic compile + backtest + analytics pipeline runs.

Core design principle:
- Strategy design can involve LLMs.
- Strategy execution is deterministic Python logic.

This gives agentic UX while keeping backtest execution reproducible.

## 2) Repository Structure

Top-level:

1. backend/
FastAPI API server, agent orchestration, parsing, data adapters, backtesting engine, analytics.

2. frontend/
Next.js dashboard and landing page, charts, pipeline visualization, and export UI.

3. implementation_plan.md
Architecture/design planning document.

4. README.md
Product-level overview and quickstart.

## 3) Backend Architecture

Backend entrypoint:
- backend/main.py

FastAPI app:
1. Creates app metadata.
2. Enables CORS for all origins/methods/headers.
3. Registers API router from app.api.routes.
4. Exposes root health-ish endpoint at /.

### 3.1 API Routes

File: backend/app/api/routes.py

Exposed endpoints:

1. POST /api/backtest
Input model: BacktestRequest
- strategy_text
- symbol (default AAPL)
- timeframe (default 1d)
- lookback (default 2y)

Flow:
- Builds ParseRequest from BacktestRequest.
- Calls run_full_pipeline from supervisor agent.
- Stores result in in-memory dict keyed by run_id.
- Returns BacktestResult.

2. POST /api/generate
Input model: GenerateRequest
- goal
- symbol (default AAPL)
- lookback (default 2y)

Flow:
- Calls generate_and_backtest in generator agent module.
- Stores and returns BacktestResult.

3. GET /api/backtest/{run_id}
- Returns previously stored run from in-memory map.
- 404 if run_id not present.

4. GET /api/health
- Returns status, app version, and whether GROQ key exists.

Important runtime characteristic:
- Result persistence is memory-only in this MVP implementation.
- Restarting backend clears historical runs.

### 3.2 Core Configuration

File: backend/app/core/config.py

Configuration includes:

1. App info
- APP_NAME
- APP_VERSION
- DEBUG

2. LLM
- GROQ_API_KEY
- Primary model: llama-3.3-70b-versatile
- Fallback model: llama-3.1-8b-instant
- Temperature, token limit, timeout

3. Optional market API key
- ALPHA_VANTAGE_KEY

4. Defaults
- lookback/timeframe
- starting capitals for INR/USD contexts

5. Cache
- CACHE_TTL_SECONDS (1 hour default)

### 3.3 Enums and Contracts

File: backend/app/core/enums.py

Defines normalized values used throughout system:

1. Indicators
- sma, ema, rsi, macd, macd_signal, macd_histogram
- bollinger_upper/lower/mid
- vwap and OHLCV fields

2. Operators
- >, <, >=, <=, ==, crosses_above, crosses_below

3. Execution/friction/sizing enums
- order timing, side, commission type, slippage type, position sizing mode

4. Run status and agent names

These enums constrain both parser outputs and compiler behavior.

## 4) Data Models (Pydantic)

### 4.1 Strategy Models

File: backend/app/models/strategy.py

Major models:

1. IndicatorRef
- indicator enum
- params dict

2. ValueRef
- numeric constant

3. Rule
- left IndicatorRef
- operator
- right IndicatorRef or ValueRef

4. RuleGroup
- logic: all/any
- rules list

5. Friction
- commission + slippage nested models

6. PositionSizing

7. Execution

8. Lookback

9. StrategySchema
The canonical executable strategy contract:
- strategy_name, asset_class
- symbols
- timeframe, lookback
- execution
- entry, exit
- position_sizing
- friction
- benchmark

10. ParseResult
- parsed_strategy (StrategySchema)
- confidence
- ambiguities
- explanation
- strategy_type

11. API request models
- ParseRequest
- BacktestRequest

### 4.2 Result Models

File: backend/app/models/result.py

BacktestResult is the final payload to frontend. Includes:

1. Metadata
- run_id
- strategy_name/symbol/timeframe/lookback/benchmark
- explanation/strategy_type/confidence/ambiguities

2. Core outputs
- metrics
- trades
- signals
- equity_curve
- drawdown_curve
- price_series
- benchmark_series

3. Diagnostics
- risk_warnings
- insights
- agent_logs

4. Status and timing
- status
- error
- duration_ms

## 5) Parsing Layer (Manual Mode)

### 5.1 Prompt System

File: backend/app/parsing/prompts.py

Contains:
1. SYSTEM_PROMPT with strict instructions:
- only allowed indicators/operators
- JSON-only output
- defaults for missing info
- required schema shape
- strategy type classification

2. FEW_SHOT_EXAMPLES
Two examples used to anchor parser output formatting.

3. build_user_prompt
Injects user strategy + symbol/timeframe/lookback into prompt.

### 5.2 LLM Provider + Fallback

File: backend/app/parsing/provider.py

call_llm behavior:

1. Tries primary model.
2. Up to 2 attempts/model.
3. Parses output as JSON (direct or regex extraction).
4. On malformed output first retry adds stricter instruction.
5. Falls back to second model.
6. Raises runtime error only if all attempts fail.

### 5.3 Parser Service

File: backend/app/parsing/parser.py

parse_strategy behavior:

1. Detects market profile from symbol (US/India/crypto defaults).
2. Calls build_user_prompt and call_llm.
3. If LLM call fails:
- Tries hardcoded demo strategy matcher (golden cross pattern).
- If no match, raises error.

4. Injects runtime context into parsed_strategy:
- actual symbol/timeframe/lookback from request
- benchmark from market detection
- commission currency from market detection

5. Validates parsed output with StrategySchema.
6. Returns ParseResult.

Why this matters:
- LLM output is constrained and normalized before entering compiler.
- Prevents freeform text from reaching deterministic execution logic.

## 6) Agent Orchestration Paths

There are two paths:

1. Manual path: run_full_pipeline (supervisor)
2. Generative path: generate_and_backtest (CrewAI + deterministic pipeline)

### 6.1 Manual Path: Supervisor Agent

File: backend/app/agents/supervisor.py

run_full_pipeline sequence:

1. Parser stage
- parse_strategy(req)
- logs confidence in agent_logs

2. Reasoning stage (deterministic summary)
- This stage currently adds explanatory summary only.
- Structural validation is already handled by Pydantic earlier.

3. Data fetch stage
- fetch_bars for symbol
- attempts benchmark fetch (non-fatal on failure)

4. Compiler stage
- compile_strategy(df, strategy)
- logs warmup and signal counts

5. Execution stage
- run_backtest(df, signals, strategy)
- logs trade count and final equity

6. Analytics stage
- compute_metrics
- generate_risk_warnings
- generate_insights
- computes drawdown curve from equity curve

7. Returns BacktestResult with all fields

Error handling:
- Any exception returns status failed with error string and partial logs.

### 6.2 Generative Path: CrewAI Strategy Generation

Files:
- backend/app/agents/crew.py
- backend/app/agents/generator.py

#### crew.py responsibilities

Defines three CrewAI agents and tasks:

1. Market Analyst
Analyzes recent market context.

2. Strategy Architect
Generates strategy JSON with required rule shape.

3. Risk Assessor
Reviews and refines final strategy JSON.

Crew process is sequential:
- analyze_market -> design_strategy -> assess_risk

#### generator.py responsibilities

generate_and_backtest sequence:

1. Fetch bars for chosen symbol.
2. Build structured market context string from last 7 days.
3. Kick off CrewAI crew.
4. Parse crew output to JSON with robust extractor.
5. Normalize and validate rule indicators/operators.
6. Convert to StrategySchema.
7. Compile strategy.
8. Execute backtest.
9. Run analytics and build final result.

Additional resiliency in generative mode:

1. Indicator normalization aliases
Examples:
- price -> close
- bb_upper -> bollinger_upper
- macd_line -> macd

2. Goal-based fallback strategies
If generated JSON is malformed or rule sets invalid/empty:
- picks fallback template by goal class:
  - trend_following
  - mean_reversion
  - momentum
  - default balanced

3. Compile fallback
If compile fails on generated strategy:
- swaps to fallback strategy and retries compile.

Net result:
- Generative mode tries to avoid hard failure and deliver runnable strategies.

## 7) Data Layer: Market Data Failsafe

File: backend/app/data/adapters.py

fetch_bars uses a 4-source fallback chain:

1. Yahoo Finance chart API (direct HTTP)
2. Stooq CSV API
3. Alpha Vantage (if key configured)
4. Synthetic GBM sample data

### 7.1 Caching

- In-memory cache by symbol|period key.
- TTL from settings (default 1 hour).
- Returns copy to avoid accidental mutation.

### 7.2 Data quality checks

Before returning data:
1. Remove duplicate timestamps.
2. Reject non-positive open/close.
3. Forward-fill short gaps.
4. Drop rows missing close.

### 7.3 Market detection

detect_market(symbol) provides defaults by market category:

1. India symbols (.NS/.BO)
- INR
- benchmark ^NSEI
- flat commission
- default slippage and capital

2. Crypto symbols
- USD
- benchmark BTC-USD
- percentage commission

3. US/other symbols
- USD
- benchmark ^GSPC
- low default slippage

This informs parser, friction defaults, and initial capital assumptions.

## 8) Compiler and Signal Generation

File: backend/app/backtesting/compiler.py

Purpose:
- Convert StrategySchema rules into boolean entry/exit vectors.
- Keep execution engine independent from rule interpretation.

### 8.1 Rule evaluation mechanics

1. _compute_side
- IndicatorRef -> computed indicator series
- ValueRef -> constant series

2. _evaluate_operator
Supports relational and cross operators.

Cross logic:
- crosses_above: prev_left <= prev_right AND left > right
- crosses_below: prev_left >= prev_right AND left < right

3. Rule groups
- logic all => conjunction
- logic any => disjunction

### 8.2 Warmup handling

1. Finds max indicator period across entry/exit rules.
2. Applies 20% buffer.
3. Masks early bars as False for both entry and exit.
4. Requires minimum bars >= warmup + 10.

This avoids invalid indicator startup values triggering trades.

### 8.3 Indicator collection

Compiler also returns computed indicator map for potential charting/debug use.

Output class: CompiledSignals
- entry series
- exit series
- warmup int
- indicators dict

## 9) Indicator Library

File: backend/app/backtesting/indicators.py

Implemented indicators:

1. SMA
2. EMA
3. RSI
4. MACD (line, signal, histogram)
5. Bollinger Bands (upper/lower/mid)
6. VWAP
7. Raw OHLCV passthrough for price-based conditions

All indicator computation is pandas/numpy deterministic code.

## 10) Backtest Engine

File: backend/app/backtesting/engine.py

Purpose:
- Simulate trades using compiled signals with lookahead protection and friction.

### 10.1 Core execution rules

1. Signals are read from previous bar close.
2. Orders execute on next bar open.
3. Long-only behavior in this implementation.

### 10.2 Friction modeling

1. Slippage
- Buy: execution price + slip
- Sell: execution price - slip

2. Commission
- Flat per order OR percentage type (based on market/strategy config)

### 10.3 Position and equity tracking

1. On buy
- Converts available equity to shares after commission.

2. On sell
- Calculates proceeds, pnl, trade return.
- Appends Trade record.
- Updates equity.

3. End-of-data forced exit
- If position remains open, closes at final close.

### 10.4 Output payload to analytics

run_backtest returns:
1. trades list
2. signals list
3. equity_curve list
4. price_series list (after warmup)
5. final_equity
6. initial_capital

## 11) Analytics and Risk Layer

File: backend/app/analytics/metrics.py

### 11.1 Metrics computation

compute_metrics returns:

1. total_return
2. annualized_return
3. sharpe_ratio
4. sortino_ratio
5. max_drawdown
6. win_rate
7. trade_count
8. avg_trade_return
9. profit_factor
10. avg_trade_duration
11. benchmark_return
12. alpha (annualized return - benchmark return)

### 11.2 Risk warnings

Deterministic warning rules include:

1. LOW_TRADES for small sample sizes
2. HIGH_DD for high drawdown
3. LOW_WINRATE
4. HIGH_TURNOVER
5. UNPROFITABLE for profit factor < 1

### 11.3 Insights

Generates factual highlights, such as:

1. strong risk-adjusted returns (high Sharpe)
2. benchmark outperformance or underperformance
3. long holding period observation
4. high drawdown note
5. high win-rate note

No LLM is used in this analytics stage.

## 12) Frontend Architecture

Framework: Next.js app router.

Major files:

1. frontend/src/app/layout.tsx
Global layout, fonts, metadata.

2. frontend/src/app/page.tsx
Landing page with feature storytelling and links to dashboard.

3. frontend/src/app/dashboard/page.tsx
Main user workflow UI for both modes.

4. frontend/src/app/components/PipelineFlow.tsx
Graph visualization of agent pipeline using React Flow.

5. frontend/src/app/globals.css
Neo-brutalist design system and utility classes.

### 12.1 Dashboard behavior

#### Input modes

1. Backtest mode
- user enters strategy text
- calls POST /api/backtest

2. Generate mode
- user enters goal text
- calls POST /api/generate

#### Shared controls

- symbol input
- lookback buttons
- quick strategy/goal presets

#### Runtime UX

- Simulated active agent progress indicator.
- Displays result object after API returns.

#### Result rendering

Maps BacktestResult fields to UI:

1. Strategy summary card
- strategy_name, strategy_type, confidence, explanation, ambiguities

2. Metrics grid
- displays all key metrics from result.metrics

3. Charts
- equity_curve area chart
- drawdown curve area chart
- price_series line chart

4. Risk/insights panels
- from risk_warnings and insights arrays

5. Trade table
- from trades array

6. PipelineFlow diagram
- receives result diagnostics including agent logs and counts

7. Export actions
- JSON export of full result
- CSV export of trades

### 12.2 PipelineFlow component

File: frontend/src/app/components/PipelineFlow.tsx

Builds a directed graph with custom nodes for:

1. Input
2. Config
3. Parser
4. Data Fetch
5. Reasoning
6. Compiler
7. Execution
8. Analytics
9. Risk side node
10. Insights side node
11. Final tearsheet node

Each node can show:
- duration
- summary details
- status indicator

This is a visual explanation layer for the run.

## 13) How Agents Are Linked

This is the exact linkage across modules.

### 13.1 Manual mode linking

1. frontend dashboard runBacktest
2. POST /api/backtest
3. routes.create_backtest
4. supervisor.run_full_pipeline
5. parser.parse_strategy
6. data.fetch_bars
7. compiler.compile_strategy
8. engine.run_backtest
9. analytics.compute_metrics + warnings + insights
10. BacktestResult returned to frontend
11. frontend renders charts/tables/pipeline

### 13.2 Generate mode linking

1. frontend dashboard runGenerate
2. POST /api/generate
3. routes.generate_strategy
4. generator.generate_and_backtest
5. data.fetch_bars for context
6. crew.create_crew and crew.kickoff
7. output normalization + StrategySchema build
8. compiler.compile_strategy
9. engine.run_backtest
10. analytics.compute_metrics + warnings + insights
11. BacktestResult returned to frontend
12. frontend renders same result surfaces

Common convergence point:
- Both modes eventually pass through compiler + engine + analytics deterministic core.

## 14) How Final Output Is Generated (Field-by-Field)

BacktestResult is assembled by supervisor/generator from these upstream components:

1. run_id
- random short uuid slice.

2. strategy_name, strategy_type, explanation, confidence, ambiguities
- parser output (manual) or crew normalized metadata (generate).

3. symbol/timeframe/lookback/benchmark
- strategy schema context.

4. metrics
- analytics.compute_metrics over equity/trades/benchmark.

5. trades
- engine trade ledger from simulated entry/exit events.

6. signals
- buy/sell signal timestamps and prices from execution path.

7. equity_curve
- per-bar simulated equity snapshots.

8. drawdown_curve
- derived post-run from equity curve peaks.

9. price_series
- OHLC price data (post-warmup slice) from engine.

10. benchmark_series
- separate benchmark fetch and close list.

11. risk_warnings
- deterministic rule checks on metrics.

12. insights
- deterministic narrative facts from metrics.

13. agent_logs
- per-stage duration + summary strings assembled in orchestrator.

14. status/error/duration_ms
- orchestration outcome and total runtime.

## 15) Key Reliability Mechanisms

1. Strict schema contracts via Pydantic models.
2. Enums constrain indicators/operators.
3. LLM used for parsing/design, not direct execution.
4. Compiler isolates strategy rule interpretation.
5. Engine enforces next-bar execution to reduce lookahead bias.
6. Multi-source data fallback including guaranteed synthetic data.
7. Goal-based fallback templates in generative mode.
8. API returns structured failure payloads instead of crashing.

## 16) Current MVP Limitations (Important for Understanding)

1. In-memory result store only (no persistent run history after restart).
2. Long-only execution path in engine.
3. No portfolio-level multi-asset allocation logic.
4. No websocket live status despite plan docs discussing progress streams.
5. Strategy reasoning stage in supervisor is mostly summary-level today.
6. Some UI progress animation is timer-based rather than backend-stream-driven.
7. Export supports JSON/CSV only in frontend UI (no PDF flow currently wired).

## 17) End-to-End Example (Concrete)

User input in backtest mode:
- Buy when 50 SMA crosses above 200 SMA, sell when RSI > 70

What happens:

1. Parser converts text to StrategySchema with entry/exit RuleGroups.
2. Compiler computes SMA50, SMA200, RSI14 series.
3. Compiler builds entry/exit boolean vectors and masks warmup bars.
4. Engine scans bars:
- if entry signal on bar t-1, buys at bar t open plus slippage
- if exit signal on bar t-1, sells at bar t open minus slippage
5. Engine logs trades and equity timeline.
6. Analytics computes Sharpe, drawdown, win rate, alpha, and warnings.
7. Backend returns BacktestResult.
8. Frontend displays metrics cards, charts, trade table, and pipeline diagram.

## 18) Dependency Overview

Backend key dependencies:
- fastapi, uvicorn
- pydantic
- groq
- crewai, crewai-tools
- pandas, numpy
- httpx

Frontend key dependencies:
- next, react, react-dom
- recharts for charts
- @xyflow/react for pipeline graph
- tailwindcss (plus custom CSS variables/theme)

## 19) Mental Model to Remember

Think of the system as two layers:

1. Agentic interpretation layer
- Manual: parser LLM
- Generate: CrewAI agents

2. Deterministic execution layer
- compiler -> engine -> analytics

No matter how strategy intent is produced, both paths flow into the same deterministic core that generates the output.

---

If you want, a next step can be a second companion document that explains each file line-by-line as a learning guide, but this document gives the full architecture and runtime understanding end-to-end.

## 20) Architecture Used (Explained in Plain Language)

The app follows a layered, pipeline-first architecture with strict contracts between layers.

Think of it like a factory with checkpoints:

1. Experience Layer (Frontend)
- Collects user intent (strategy text or generation goal).
- Sends clean API requests.
- Displays results exactly as backend returns them.

2. Orchestration Layer (Agents)
- Decides the sequence of work.
- Connects parser/generator, data, compiler, engine, analytics.
- Produces stage logs and total run timing.

3. Intelligence Layer (LLM)
- Used for understanding/designing strategy intent.
- Never used to execute trades.

4. Deterministic Quant Layer
- Compiler interprets validated strategy rules into signals.
- Engine simulates trades with deterministic formulas.
- Analytics computes deterministic metrics and warnings.

5. Data Layer
- Fetches OHLCV from external providers with fallback chain.
- Adds cache and quality checks.

6. Contract Layer (Pydantic + Enums)
- Every stage gets typed input and typed output.
- Invalid structures fail early.

Why this architecture works well:

1. LLM creativity is isolated to intent translation/design.
2. Execution math is reproducible and testable.
3. One stable output contract powers both user modes.
4. Failures are easier to pinpoint by stage.

## 21) Connection Map: Who Calls Whom

### 21.1 Manual Backtest Connection Chain

1. Frontend dashboard sends POST /api/backtest.
2. API route builds ParseRequest.
3. Supervisor starts pipeline and timer.
4. Parser returns ParseResult (strategy schema + confidence + explanation).
5. Data adapter fetches symbol bars (and benchmark bars).
6. Compiler converts strategy rules into entry/exit vectors.
7. Engine runs simulation loop on vectors.
8. Analytics computes performance + risk + insight arrays.
9. Supervisor assembles BacktestResult.
10. API returns BacktestResult.
11. Frontend maps fields to cards/charts/table/flow graph.

### 21.2 Generate Strategy Connection Chain

1. Frontend dashboard sends POST /api/generate.
2. Generator fetches market bars first to create context.
3. CrewAI runs three agents sequentially.
4. Generator parses Crew output to JSON.
5. Generator normalizes indicators/operators to supported schema.
6. Generator converts to StrategySchema.
7. Then pipeline converges with same deterministic core:
- compile -> execute -> analytics -> assemble BacktestResult.

Important architectural convergence:
- Both modes end in the same quant engine path.
- This guarantees identical execution semantics regardless of strategy source.

## 22) Stage Inputs and Outputs (What Each Block Receives and Returns)

### 22.1 Parser Stage

Input:
- strategy_text, symbol, timeframe, lookback.

Output:
- ParseResult:
  - parsed_strategy (StrategySchema)
  - confidence
  - ambiguities
  - explanation
  - strategy_type

Connection role:
- Bridges human language to executable strategy contract.

### 22.2 Data Stage

Input:
- symbol, lookback, timeframe.

Output:
- Clean OHLCV DataFrame + attrs[data_source].

Connection role:
- Provides normalized price data for compiler and benchmark comparison.

### 22.3 Compiler Stage

Input:
- OHLCV DataFrame + StrategySchema.

Output:
- CompiledSignals:
  - entry boolean series
  - exit boolean series
  - warmup bars
  - indicator series map

Connection role:
- Converts logical rules into machine-readable time series decisions.

### 22.4 Execution Stage

Input:
- OHLCV DataFrame + CompiledSignals + StrategySchema.

Output:
- trades
- signals
- equity_curve
- price_series
- initial_capital/final_equity

Connection role:
- Turns signals into simulated portfolio behavior with costs and slippage.

### 22.5 Analytics Stage

Input:
- trades + equity_curve + capitals + optional benchmark series.

Output:
- metrics
- risk_warnings
- insights
- drawdown curve (assembled at orchestration layer)

Connection role:
- Turns raw simulation artifacts into interpretable performance diagnostics.

### 22.6 Frontend Rendering Stage

Input:
- BacktestResult JSON.

Output:
- Visual story:
  - headline strategy summary
  - KPIs
  - equity/drawdown/price charts
  - trade replay table
  - risk and insight panels
  - pipeline flow graph

Connection role:
- Presents backend truth without modifying quantitative values.

## 23) Runtime Story: From One Click to Final Tearsheet

This is the same flow in narrative form so the architecture is easy to visualize.

1. User writes intent and clicks run.
2. Frontend sends one typed request to backend.
3. Backend orchestrator opens a run context and stage logger.
4. Strategy intent is translated into strict schema (manual parser or Crew path).
5. Market data is fetched with fallback and quality checks.
6. Rules are compiled into vectors so engine does not interpret text directly.
7. Backtest engine executes next-bar logic with slippage/commission.
8. Analytics computes standardized performance metrics.
9. Orchestrator packages everything into one BacktestResult object.
10. Frontend renders that object as the tearsheet and pipeline visualization.

In short:
- Intent enters as language.
- Execution happens as deterministic vectors and formulas.
- Output returns as one structured JSON contract.

That separation is the core of this architecture.