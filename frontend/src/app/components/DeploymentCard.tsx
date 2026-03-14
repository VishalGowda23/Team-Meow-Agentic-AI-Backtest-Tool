"use client";

import { useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/hljs";

// Register TS style as closest to PineScript if no explicit Pine exists
SyntaxHighlighter.registerLanguage("typescript", ts);

interface DeploymentCardProps {
  strategyJson: any; // The full strategy object/result
  symbol: string;
}

export default function DeploymentCard({ strategyJson, symbol }: DeploymentCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pineScript, setPineScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleGenerate = async () => {
    if (pineScript) return; // Already generated

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/generate-production-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_json: strategyJson }),
      });

      const data = await res.json();
      if (data.status === "error") {
        setError(data.pinescript_code);
      } else {
        setPineScript(data.pinescript_code);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate TradingView Bridge code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!pineScript) return;
    navigator.clipboard.writeText(pineScript);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="mb-8 p-5 relative overflow-hidden" style={{ background: "var(--bg-card)", border: "3px solid #252525", boxShadow: "var(--shadow-md)" }}>
      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "var(--accent-orange)" }} />
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            🚀 Go Live on TradingView
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Automatically translate your strategy into a production-ready TradingView PineScript v5 file.
          </p>
        </div>
        
        {!pineScript && !isGenerating && (
          <button 
            onClick={handleGenerate}
            className="nb-btn text-sm whitespace-nowrap self-stretch md:self-auto"
            style={{ 
              background: "var(--accent-orange)", 
              color: "#000", 
              border: "3px solid var(--accent-orange)",
              fontWeight: "bold",
              padding: "0.8rem 1.5rem"
            }}
          >
            Generate TradingView Bridge
          </button>
        )}
      </div>

      {/* ── Content Area (Inline) ──────────────────────────── */}
      <div className="mt-4">
        {/* Toast Notification */}
        {showToast && (
          <div 
            className="absolute top-4 right-4 px-4 py-2 font-bold text-xs rounded-md shadow-lg animate-fade-in z-50 flex items-center gap-2"
            style={{ background: "var(--accent-green)", color: "#000" }}
          >
            ✓ Copied to Clipboard
          </div>
        )}

        {isGenerating && (
          <div className="p-8 flex flex-col items-center justify-center rounded-md border border-[#252525] bg-[#0a0a0a]">
            <div className="w-8 h-8 rounded-full mb-4" style={{ border: "3px solid transparent", borderTopColor: "var(--accent-orange)", animation: "spin 1s linear infinite" }} />
            <div className="text-sm font-bold mono uppercase tracking-widest animate-pulse" style={{ color: "var(--accent-orange)" }}>
              Translating to PineScript v5...
            </div>
            <p className="text-xs mt-2 text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
              Wrapping strategy in execution guardrails, mapping indicators, and matching realistic backtest parameters...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md" style={{ background: "rgba(255, 23, 68, 0.1)", border: "1px solid rgba(255, 23, 68, 0.3)" }}>
            <div className="font-bold text-sm mb-2" style={{ color: "#ff1744" }}>✕ Generation Failed</div>
            <pre className="text-xs whitespace-pre-wrap mono" style={{ color: "var(--text-secondary)" }}>{error}</pre>
            <button 
              onClick={() => { setPineScript(null); handleGenerate(); }}
              className="mt-4 nb-btn nb-btn-secondary text-xs"
            >
              Retry Generation
            </button>
          </div>
        )}

        {pineScript && (
          <div className="animate-fade-in mt-6 flex flex-col gap-8">
            
            {/* Step 1: Code Section */}
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--text-secondary)" }}>
                    Step 1: Copy the Strategy Code
                  </h4>
                  <p className="text-[0.65rem] mono uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    {symbol}_Strategy.pine
                  </p>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="nb-btn text-[0.7rem] py-2 px-4 hover:bg-white/5 transition-colors"
                  style={{ border: "1px solid #333", background: "transparent", color: "var(--accent-orange)" }}
                >
                  📋 Copy Code
                </button>
              </div>
              
              <div className="h-[400px] relative rounded-md overflow-hidden border border-[#252525]">
                <SyntaxHighlighter
                  language="typescript"
                  style={dracula}
                  customStyle={{ margin: 0, padding: "1.5rem", height: "100%", fontSize: "0.85rem", background: "#0d0d0d", overflowY: "auto" }}
                  showLineNumbers={true}
                  lineNumberStyle={{ color: "#444", minWidth: "40px", paddingRight: "16px", borderRight: "1px solid #222", marginRight: "16px" }}
                >
                  {pineScript}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Step 2: TradingView Section */}
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--text-secondary)" }}>
                    Step 2: Paste into Pine Editor
                  </h4>
                  <p className="text-[0.65rem] mono uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    Live Interactive Chart ({symbol})
                  </p>
                </div>
                <div className="text-[0.65rem] text-right" style={{ color: "var(--text-muted)" }}>
                  Open the <strong style={{ color: "var(--text-secondary)" }}>Pine Editor</strong> tab below the chart ⬇
                </div>
              </div>
              
              <div className="h-[700px] rounded-md overflow-hidden border border-[#252525] bg-black shadow-2xl">
                <iframe 
                  src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_123&symbol=${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
