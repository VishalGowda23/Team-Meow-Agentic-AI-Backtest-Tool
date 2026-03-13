"use client";

import { useState } from "react";
import Link from "next/link";

const EXAMPLE_STRATEGIES = [
  "Buy when 50-day SMA crosses above 200-day SMA, sell when RSI exceeds 70",
  "Buy when RSI drops below 30, sell when RSI goes above 70",
  "Buy when MACD line crosses above signal line, sell when MACD crosses below",
  "Buy when price closes above upper Bollinger Band, sell when it drops below the middle band",
];

export default function Home() {
  const [hoveredExample, setHoveredExample] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "var(--bg-primary)",
          borderBottom: "3px solid #222",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center font-bold text-sm"
            style={{
              background: "var(--accent-cyan)",
              color: "#000",
              border: "2px solid #000",
              boxShadow: "3px 3px 0px #000",
            }}
          >
            AS
          </div>
          <span className="font-bold text-lg tracking-tight">
            Astra<span style={{ color: "var(--accent-cyan)" }}>.AI</span>
          </span>
        </div>
        <Link href="/dashboard">
          <button className="nb-btn nb-btn-primary">Launch App →</button>
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Tag */}
          <div className="mb-6">
            <span className="nb-tag nb-tag-cyan">Agentic AI Engine</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6"
            style={{ maxWidth: "800px" }}
          >
            Backtest strategies
            <br />
            in{" "}
            <span
              style={{
                background: "var(--accent-cyan)",
                color: "#000",
                padding: "0 0.2em",
                display: "inline-block",
                boxShadow: "4px 4px 0px #000",
              }}
            >
              plain English
            </span>
          </h1>

          <p
            className="text-lg md:text-xl mb-10"
            style={{ color: "var(--text-secondary)", maxWidth: "600px" }}
          >
            Type your trading strategy. Our 6-agent AI pipeline parses, validates,
            compiles, simulates, and analyzes it — returning a full performance
            tearsheet in seconds.
          </p>

          <div className="flex gap-4 flex-wrap">
            <Link href="/dashboard">
              <button className="nb-btn nb-btn-lime text-base px-8 py-4">
                Start Backtesting →
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="nb-btn nb-btn-secondary text-base px-8 py-4">
                How it works
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Pipeline visualization ──────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-3">
            <span className="nb-tag nb-tag-lime">Architecture</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            6 Agents. One Pipeline. Zero Hallucinations.
          </h2>

          <div className="grid gap-4">
            {[
              {
                name: "Parser Agent",
                desc: "Converts natural language to structured rules via LLM",
                tag: "LLM-Powered",
                color: "var(--accent-cyan)",
              },
              {
                name: "Reasoning Agent",
                desc: "Validates feasibility, detects contradictions, generates risk notes",
                tag: "Deterministic",
                color: "var(--accent-lime)",
              },
              {
                name: "Strategy Compiler",
                desc: "Converts rules into executable signal vectors with warmup handling",
                tag: "Deterministic",
                color: "var(--accent-orange)",
              },
              {
                name: "Execution Agent",
                desc: "Runs simulation with commission, slippage, and lookahead protection",
                tag: "Deterministic",
                color: "var(--accent-green)",
              },
              {
                name: "Analytics Agent",
                desc: "Computes Sharpe, drawdown, win rate, insights, and risk warnings",
                tag: "Deterministic",
                color: "var(--accent-purple)",
              },
              {
                name: "Improvement Agent",
                desc: "Suggests strategy variants based on results (optional)",
                tag: "Optional",
                color: "var(--accent-pink)",
              },
            ].map((agent, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4"
                style={{
                  background: "var(--bg-card)",
                  border: `3px solid ${agent.color}33`,
                  borderLeft: `6px solid ${agent.color}`,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  className="mono text-xs font-bold w-7 h-7 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: agent.color,
                    color: "#000",
                    border: "2px solid #000",
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{agent.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {agent.desc}
                  </div>
                </div>
                <span
                  className="nb-tag text-[0.6rem]"
                  style={{ borderColor: agent.color, color: agent.color }}
                >
                  {agent.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Example strategies ──────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-3">
            <span className="nb-tag nb-tag-orange">Examples</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Try these strategies
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {EXAMPLE_STRATEGIES.map((s, i) => (
              <Link href={`/dashboard?strategy=${encodeURIComponent(s)}`} key={i}>
                <div
                  className="nb-card cursor-pointer group"
                  onMouseEnter={() => setHoveredExample(i)}
                  onMouseLeave={() => setHoveredExample(null)}
                  style={{
                    borderColor: hoveredExample === i ? "var(--accent-cyan)" : "#333",
                  }}
                >
                  <div className="mono text-xs mb-2" style={{ color: "var(--accent-cyan)" }}>
                    Strategy #{i + 1}
                  </div>
                  <p className="text-sm leading-relaxed">{s}</p>
                  <div
                    className="mt-3 text-xs font-bold uppercase tracking-wider"
                    style={{
                      color: hoveredExample === i ? "var(--accent-cyan)" : "var(--text-muted)",
                    }}
                  >
                    Click to test →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        className="py-8 px-6 text-center"
        style={{ borderTop: "3px solid #222" }}
      >
        <p className="mono text-xs" style={{ color: "var(--text-muted)" }}>
          Astra.AI — For educational & research purposes only. Not financial advice.
        </p>
      </footer>
    </div>
  );
}
