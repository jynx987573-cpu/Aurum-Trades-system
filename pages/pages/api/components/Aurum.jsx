 import { useState, useRef, useEffect, useCallback } from "react";

// ── PUBLIC API KEYS (news only — these are safe to be public) ──
const NEWS_KEY    = "140c65c950fb4e9aa5058859445d80f3";
const FINNHUB_KEY = "d6u06cpr01qjm9brvmh0d6u06cpr01qjm9brvmhg";
const PROXY       = "https://corsproxy.io/?";

// ── AI CALL ENDPOINT — points to your Vercel backend ──────────
// This hides your Anthropic key safely on the server
const AI_ENDPOINT = "/api/claude";

// ── VISION SYSTEM PROMPT ──────────────────────────────────────
const VISION_PROMPT = `You are AURUM — an elite professional Gold (XAUUSD) chart analyst with 20 years of trading experience.

The user has sent you a screenshot of their XAUUSD chart. Analyze it COMPLETELY like a senior trader would.

IDENTIFY EVERYTHING VISIBLE:
1. TREND: Direction, Higher Highs/Higher Lows or Lower Highs/Lower Lows
2. CANDLESTICK PATTERNS: Doji, Engulfing, Hammer, Shooting Star, Pin Bar
3. CHART PATTERNS: Head & Shoulders, Double Top/Bottom, Triangle, Flag, Wedge, Channel
4. SMC CONCEPTS: Order Blocks (OB), Fair Value Gaps (FVG), Break of Structure (BOS), Change of Character (CHoCH), Liquidity above highs / below lows
5. KEY LEVELS: Support & Resistance zones visible
6. INDICATORS: RSI value & divergence, MACD crossover, EMA positions, Bollinger Bands
7. TIMEFRAME: What timeframe is shown
8. PRICE: Current price visible on chart

RESPOND IN THIS EXACT FORMAT:

## 🔍 CHART READING

**📐 TIMEFRAME:** [detected]
**💰 PRICE:** [from chart]
**📊 TREND:** [clear description]

**🕯️ PATTERNS FOUND:**
• [pattern 1 with location]
• [pattern 2]
• [pattern 3 if any]

**🎯 KEY LEVELS:**
• Resistance: [price]
• Support: [price]
• [other zones]

**📈 INDICATORS:**
• RSI: [value + what it means]
• MACD: [reading]
• EMA: [position]

**🧠 FULL ANALYSIS:**
[3-4 sentences — what is happening right now on this chart]

**🎯 TRADE SETUP:**
Direction: [BUY/SELL/WAIT]
Entry: [price]
SL: [price] ([X] pips)
TP1: [price] ([X] pips)
TP2: [price] ([X] pips)
RR: 1:[X]

**⚡ CONFIDENCE:** [LOW/MEDIUM/HIGH/VERY HIGH] — [reason]
**🚨 INVALIDATION:** [price that cancels setup]
**💡 BEGINNER TIP:** [explain the most important thing on this chart in simple words]`;

// ── TEXT SYSTEM PROMPT ────────────────────────────────────────
const TEXT_PROMPT = `You are AURUM — elite AI trading analyst for XAUUSD (Gold).
When given live price and news, USE THEM. Give specific prices for entry/SL/TP.

ALWAYS respond in EXACTLY this format:

## 🔮 AURUM ANALYSIS

**📊 BIAS:** [BULLISH/BEARISH/NEUTRAL] — [reason]

**📰 MACRO:**
• [news impact 1]
• [news impact 2]
• [news impact 3]

**📈 TECHNICALS:**
• [technical point 1]
• [technical point 2]
• [technical point 3]

**🎯 SETUP:**
Direction: [BUY/SELL/WAIT]
Entry: [price]
SL: [price] ([X] pips)
TP1: [price] ([X] pips)
TP2: [price] ([X] pips)
RR: 1:[X]

**⚡ CONFIDENCE:** [LOW/MEDIUM/HIGH/VERY HIGH] — [reason]
**⏰ SESSION:** [Asian/London/New York]
**🚨 INVALIDATION:** [price]
**💡 ADVICE:** [1-2 sentences]`;

// ── CSS ───────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2);border-radius:2px;}
html,body{background:#06080d;}
.root{min-height:100vh;background:#06080d;font-family:'DM Mono',monospace;color:#e8d5a3;overflow-x:hidden;}
.bgfx{position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 50% at 10% 0%,rgba(212,175,55,.06) 0%,transparent 55%),
  radial-gradient(ellipse 60% 70% at 90% 100%,rgba(212,175,55,.04) 0%,transparent 55%);}
.wrap{position:relative;z-index:1;max-width:500px;margin:0 auto;padding-bottom:80px;}

/* HEADER */
.hdr{padding:18px 18px 13px;text-align:center;border-bottom:1px solid rgba(212,175,55,.1);background:linear-gradient(180deg,rgba(212,175,55,.05),transparent);}
.logo-row{display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:1px;}
.gem{width:36px;height:36px;background:linear-gradient(135deg,#d4af37,#f5d06b,#9a6f1a);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 24px rgba(212,175,55,.5);}
.logotxt{font-family:'Bebas Neue',sans-serif;font-size:38px;letter-spacing:8px;line-height:1;background:linear-gradient(135deg,#c9a227,#f0c84a,#c9a227);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.logsub{font-size:8px;color:rgba(212,175,55,.38);letter-spacing:3px;text-transform:uppercase;margin-top:1px;}
.price-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:9px;flex-wrap:wrap;}
.pval{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:2px;color:#d4af37;text-shadow:0 0 18px rgba(212,175,55,.3);}
.pchg{font-size:11px;padding:3px 10px;border-radius:20px;letter-spacing:.5px;}
.up{background:rgba(52,211,153,.1);color:#34d399;border:1px solid rgba(52,211,153,.25);}
.dn{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.25);}
.fl{background:rgba(212,175,55,.08);color:#d4af37;border:1px solid rgba(212,175,55,.2);}
.lpill{display:flex;align-items:center;gap:5px;font-size:9px;color:rgba(52,211,153,.6);letter-spacing:2px;}
.ldot{width:6px;height:6px;background:#34d399;border-radius:50%;animation:ldot 2s infinite;}
@keyframes ldot{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(52,211,153,.5);}50%{opacity:.6;box-shadow:0 0 0 5px rgba(52,211,153,0);}}
.arow{display:flex;justify-content:center;gap:9px;margin-top:6px;flex-wrap:wrap;}
.chip{display:flex;align-items:center;gap:4px;font-size:8px;letter-spacing:1px;color:rgba(212,175,55,.3);text-transform:uppercase;}
.cdot{width:4px;height:4px;border-radius:50%;}
.cdot.ok{background:#34d399;}.cdot.err{background:#ef4444;}.cdot.spin{background:#d4af37;animation:ldot 1.5s infinite;}
.rfbtn{margin-top:7px;background:none;border:1px solid rgba(212,175,55,.18);border-radius:8px;color:rgba(212,175,55,.38);font-size:8px;padding:5px 14px;cursor:pointer;letter-spacing:2px;font-family:'DM Mono',monospace;}

/* TABS */
.tabs{display:flex;margin:12px 12px 0;background:rgba(0,0,0,.3);border:1px solid rgba(212,175,55,.08);border-radius:12px;padding:3px;gap:2px;overflow-x:auto;}
.tab{flex:1;min-width:50px;padding:8px 3px;border:none;background:none;color:rgba(212,175,55,.28);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;border-radius:9px;cursor:pointer;transition:all .2s;white-space:nowrap;}
.tab.on{background:linear-gradient(135deg,rgba(212,175,55,.16),rgba(212,175,55,.06));color:#d4af37;border:1px solid rgba(212,175,55,.18);}
.tab.vtab.on{background:linear-gradient(135deg,rgba(139,92,246,.18),rgba(139,92,246,.06));color:#a78bfa;border:1px solid rgba(139,92,246,.25);}

/* VISION */
.vwrap{margin:12px;}
.vhero{background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(212,175,55,.04));border:1px solid rgba(139,92,246,.18);border-radius:18px;padding:18px;text-align:center;margin-bottom:14px;}
.vhero-icon{font-size:40px;display:block;margin-bottom:8px;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
.vhero-title{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:4px;background:linear-gradient(135deg,#a78bfa,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:5px;}
.vhero-sub{font-size:10px;color:rgba(212,175,55,.42);line-height:1.65;letter-spacing:.5px;}
.steps{background:rgba(255,255,255,.02);border:1px solid rgba(212,175,55,.07);border-radius:14px;padding:13px;margin-bottom:14px;}
.steps-ttl{font-size:8px;letter-spacing:3px;color:rgba(212,175,55,.32);text-transform:uppercase;margin-bottom:10px;}
.step{display:flex;align-items:flex-start;gap:10px;margin-bottom:9px;}
.step:last-child{margin-bottom:0;}
.snum{width:24px;height:24px;min-width:24px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.06));border:1px solid rgba(212,175,55,.18);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:13px;color:#d4af37;}
.stxt{font-size:11px;color:rgba(212,175,55,.48);line-height:1.5;padding-top:3px;}
.stxt strong{color:#e8d5a3;}
.upload-section{margin-bottom:14px;}
.upload-title{font-size:8px;letter-spacing:3px;color:rgba(139,92,246,.45);text-transform:uppercase;text-align:center;margin-bottom:10px;}
.upload-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.upbtn{position:relative;border-radius:16px;padding:22px 12px;text-align:center;cursor:pointer;border:none;transition:all .2s;overflow:hidden;display:block;}
.upbtn input[type=file]{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;font-size:100px;}
.upbtn.gallery{background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(139,92,246,.06));border:2px solid rgba(139,92,246,.3);}
.upbtn.gallery:active{transform:scale(.97);}
.upbtn.camera{background:linear-gradient(135deg,rgba(212,175,55,.12),rgba(212,175,55,.04));border:2px solid rgba(212,175,55,.25);}
.upbtn.camera:active{transform:scale(.97);}
.upbtn-icon{font-size:34px;display:block;margin-bottom:8px;pointer-events:none;}
.upbtn-label{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:3px;display:block;margin-bottom:3px;pointer-events:none;}
.upbtn.gallery .upbtn-label{color:#a78bfa;}
.upbtn.camera .upbtn-label{color:#d4af37;}
.upbtn-sub{font-size:9px;letter-spacing:1px;display:block;pointer-events:none;}
.upbtn.gallery .upbtn-sub{color:rgba(139,92,246,.45);}
.upbtn.camera .upbtn-sub{color:rgba(212,175,55,.35);}
.or-row{display:flex;align-items:center;gap:10px;margin:2px 0 10px;}
.or-line{flex:1;height:1px;background:rgba(212,175,55,.08);}
.or-txt{font-size:9px;color:rgba(212,175,55,.25);letter-spacing:2px;}
.upbtn-full{position:relative;width:100%;border-radius:14px;padding:16px;text-align:center;cursor:pointer;border:2px dashed rgba(212,175,55,.2);background:rgba(212,175,55,.03);transition:all .2s;overflow:hidden;display:block;}
.upbtn-full input[type=file]{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;font-size:100px;}
.upbtn-full:active{background:rgba(212,175,55,.07);}
.upbtn-full-txt{font-size:10px;color:rgba(212,175,55,.35);letter-spacing:2px;pointer-events:none;}
.prev-wrap{border:1px solid rgba(139,92,246,.2);border-radius:16px;overflow:hidden;margin-bottom:12px;background:#0a0c11;}
.prev-img{width:100%;display:block;max-height:300px;object-fit:contain;}
.prev-bar{padding:10px 12px;background:rgba(139,92,246,.06);border-top:1px solid rgba(139,92,246,.1);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
.prev-info{font-size:9px;color:rgba(139,92,246,.55);letter-spacing:1px;}
.prev-btns{display:flex;gap:6px;}
.prev-btn{border:none;border-radius:8px;padding:6px 12px;font-family:'DM Mono',monospace;font-size:9px;cursor:pointer;letter-spacing:1px;position:relative;overflow:hidden;}
.prev-btn input[type=file]{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;font-size:100px;}
.prev-btn.change{background:rgba(212,175,55,.1);color:#d4af37;border:1px solid rgba(212,175,55,.2);}
.prev-btn.remove{background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.15);}
.ctx{background:rgba(255,255,255,.02);border:1px solid rgba(212,175,55,.07);border-radius:13px;padding:12px;margin-bottom:12px;}
.ctx-ttl{font-size:8px;letter-spacing:3px;color:rgba(212,175,55,.3);text-transform:uppercase;margin-bottom:9px;}
.ctx-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px;}
.ilbl{font-size:8px;color:rgba(212,175,55,.26);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;}
.inp{background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.1);border-radius:8px;padding:8px 10px;color:#e8d5a3;font-family:'DM Mono',monospace;font-size:12px;width:100%;outline:none;}
.inp::placeholder{color:rgba(212,175,55,.13);}
.sel{background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.1);border-radius:8px;padding:8px 10px;color:#e8d5a3;font-family:'DM Mono',monospace;font-size:11px;width:100%;outline:none;appearance:none;cursor:pointer;}
.sel option{background:#0d1017;}
.ta{background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.1);border-radius:8px;padding:9px 11px;color:#e8d5a3;font-family:'DM Mono',monospace;font-size:11px;width:100%;outline:none;resize:none;min-height:56px;line-height:1.5;}
.ta::placeholder{color:rgba(212,175,55,.13);}
.vabtn{width:100%;padding:16px;background:linear-gradient(135deg,#7c3aed,#a78bfa,#5b21b6);border:none;border-radius:14px;color:#fff;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:4px;cursor:pointer;position:relative;overflow:hidden;transition:all .2s;box-shadow:0 4px 22px rgba(139,92,246,.3);margin-bottom:2px;}
.vabtn:disabled{opacity:.4;cursor:not-allowed;}
.vabtn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:translateX(-100%);animation:shim 2.5s infinite;}
@keyframes shim{100%{transform:translateX(100%);}}
.rcard{border:1px solid rgba(139,92,246,.2);border-radius:16px;overflow:hidden;animation:up .35s ease;margin-top:12px;}
@keyframes up{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
.rhdr{padding:11px 14px;border-bottom:1px solid rgba(139,92,246,.1);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
.rhdr.violet{background:linear-gradient(90deg,rgba(139,92,246,.12),rgba(139,92,246,.02));}
.rhdr.gold{background:linear-gradient(90deg,rgba(212,175,55,.09),rgba(212,175,55,.02));border-color:rgba(212,175,55,.08);}
.rtitle{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:3px;}
.rtitle.violet{color:#a78bfa;}.rtitle.gold{color:#d4af37;}
.rhr{display:flex;align-items:center;gap:7px;}
.rts{font-size:8px;letter-spacing:1px;}
.rts.violet{color:rgba(139,92,246,.4);}.rts.gold{color:rgba(212,175,55,.28);}
.svbtn{background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);border-radius:7px;color:#a78bfa;font-family:'DM Mono',monospace;font-size:8px;padding:4px 9px;cursor:pointer;}
.svbtn.gold{background:rgba(212,175,55,.08);border-color:rgba(212,175,55,.2);color:#d4af37;}
.rbody{padding:13px;font-size:11.5px;line-height:1.78;color:#d4c584;}
.rbody strong{color:#f0e0a0;}
.rbody .mh{font-family:'Syne',sans-serif;font-size:12px;color:#a78bfa;margin:10px 0 5px;}
.rbody.gold .mh{color:#d4af37;}
.rbody ul{padding-left:12px;margin:2px 0;}
.rbody li{margin-bottom:2px;}
.appsec{background:rgba(52,211,153,.03);border:1px solid rgba(52,211,153,.1);border-radius:14px;padding:13px;margin-top:10px;}
.apptitle{font-size:8px;letter-spacing:3px;color:rgba(52,211,153,.45);text-transform:uppercase;margin-bottom:9px;}
.appgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:9px;}
.apf{background:rgba(0,0,0,.3);border:1px solid rgba(52,211,153,.08);border-radius:8px;padding:8px;text-align:center;}
.apfl{font-size:8px;color:rgba(52,211,153,.38);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;}
.apfv{font-size:13px;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;}
.apfv.e{color:#e8d5a3;}.apfv.s{color:#ef4444;}.apfv.t{color:#34d399;}
.appbtn{width:100%;padding:14px;border:none;border-radius:10px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:4px;cursor:pointer;transition:all .2s;}
.appbtn.buy{background:linear-gradient(135deg,#34d399,#059669);color:#06080d;box-shadow:0 4px 14px rgba(52,211,153,.22);}
.appbtn.sell{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.22);}
.appbtn.wait{background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.15);color:#d4af37;}
.appbtn:disabled{opacity:.38;cursor:not-allowed;}
.lcard{background:rgba(139,92,246,.02);border:1px solid rgba(139,92,246,.08);border-radius:16px;padding:26px;text-align:center;margin-top:12px;}
.lcard.gold{background:rgba(212,175,55,.02);border-color:rgba(212,175,55,.07);margin:0 12px 12px;}
.lorb{width:44px;height:44px;border-radius:50%;border:2px solid rgba(139,92,246,.1);border-top-color:#a78bfa;animation:spin .7s linear infinite;margin:0 auto 12px;}
.lorb.gold{border-color:rgba(212,175,55,.07);border-top-color:#d4af37;}
@keyframes spin{100%{transform:rotate(360deg);}}
.ltxt{font-size:10px;color:rgba(139,92,246,.5);letter-spacing:2px;text-transform:uppercase;animation:blk 1.5s ease-in-out infinite;}
.ltxt.gold{color:rgba(212,175,55,.42);}
@keyframes blk{0%,100%{opacity:1;}50%{opacity:.28;}}
.lsub{font-size:9px;color:rgba(139,92,246,.25);margin-top:4px;letter-spacing:1px;}
.lsub.gold{color:rgba(212,175,55,.2);}
.lprogress{display:flex;flex-direction:column;gap:6px;margin-top:14px;}
.lprow{display:flex;align-items:center;gap:8px;font-size:9px;color:rgba(139,92,246,.35);letter-spacing:1px;}
.lprow.done{color:rgba(52,211,153,.6);}
.lprow.active{color:#a78bfa;animation:blk 1s ease-in-out infinite;}
.lprow-dot{width:6px;height:6px;border-radius:50%;background:rgba(139,92,246,.15);}
.lprow.done .lprow-dot{background:#34d399;}
.lprow.active .lprow-dot{background:#a78bfa;}
.fcard{margin:12px;background:rgba(255,255,255,.015);border:1px solid rgba(212,175,55,.08);border-radius:16px;overflow:hidden;}
.fsec{padding:12px;border-bottom:1px solid rgba(212,175,55,.05);}
.fsec:last-child{border-bottom:none;}
.slbl{font-size:8px;letter-spacing:3px;color:rgba(212,175,55,.32);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
.slbl::after{content:'';flex:1;height:1px;background:rgba(212,175,55,.05);}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.iwrap{display:flex;flex-direction:column;gap:3px;}
.bias-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;}
.bbtn{padding:9px 4px;border:1px solid rgba(212,175,55,.1);border-radius:8px;background:rgba(212,175,55,.02);color:rgba(212,175,55,.26);font-family:'DM Mono',monospace;font-size:9px;cursor:pointer;transition:all .2s;text-align:center;}
.bbtn.bull.on{background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.28);color:#34d399;}
.bbtn.bear.on{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.28);color:#ef4444;}
.bbtn.neut.on{background:rgba(212,175,55,.08);border-color:rgba(212,175,55,.28);color:#d4af37;}
.abtn{margin:12px;width:calc(100% - 24px);padding:14px;background:linear-gradient(135deg,#d4af37,#f0c84a,#9a6f1a);border:none;border-radius:12px;color:#06080d;font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:4px;cursor:pointer;position:relative;overflow:hidden;transition:all .2s;box-shadow:0 4px 20px rgba(212,175,55,.22);}
.abtn:disabled{opacity:.45;cursor:not-allowed;}
.abtn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);transform:translateX(-100%);animation:shim 2.5s infinite;}
.sigcard{margin:0 12px 12px;border:1px solid rgba(212,175,55,.13);border-radius:16px;overflow:hidden;animation:up .3s ease;}
.sighdr{padding:11px 14px;background:linear-gradient(90deg,rgba(212,175,55,.09),rgba(212,175,55,.02));border-bottom:1px solid rgba(212,175,55,.08);display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;}
.sigtitle{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:3px;color:#d4af37;}
.shr{display:flex;align-items:center;gap:7px;}
.ts{font-size:8px;color:rgba(212,175,55,.28);letter-spacing:1px;}
.sigbody{padding:13px;font-size:11.5px;line-height:1.75;color:#d4c584;}
.sigbody strong{color:#f0e0a0;}
.sigbody .mh{font-family:'Syne',sans-serif;font-size:12px;color:#d4af37;margin:10px 0 5px;}
.sigbody ul{padding-left:12px;margin:2px 0;}
.sigbody li{margin-bottom:2px;}
.sig-appsec{margin:0 12px 12px;}
.s
