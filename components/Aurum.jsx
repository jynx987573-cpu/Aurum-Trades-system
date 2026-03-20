import{useState,useRef,useEffect,useCallback}from"react";
const NK="140c65c950fb4e9aa5058859445d80f3";
const PX="https://corsproxy.io/?";
const EP="/api/claude";
const VP=`You are AURUM — elite XAUUSD Gold chart analyst. Analyze the chart screenshot completely.
RESPOND IN THIS FORMAT:
## CHART READING
**TIMEFRAME:** [detected]
**PRICE:** [from chart]
**TREND:** [description]
**PATTERNS:**
- [pattern 1]
- [pattern 2]
**KEY LEVELS:**
- Resistance: [price]
- Support: [price]
**INDICATORS:**
- RSI: [value and meaning]
- EMA: [position]
**ANALYSIS:** [3-4 sentences about what is happening]
**TRADE SETUP:**
Direction: [BUY/SELL/WAIT]
Entry: [price]
SL: [price] ([X] pips)
TP1: [price] ([X] pips)
TP2: [price] ([X] pips)
RR: 1:[X]
**CONFIDENCE:** [LOW/MEDIUM/HIGH/VERY HIGH] - [reason]
**INVALIDATION:** [price]
**TIP:** [simple explanation for beginner]`;

const TP=`You are AURUM — elite AI trading analyst for XAUUSD Gold.
Use live price and news. Give specific prices for entry/SL/TP.
RESPOND IN THIS FORMAT:
## AURUM ANALYSIS
**BIAS:** [BULLISH/BEARISH/NEUTRAL] - [reason]
**MACRO:**
- [news 1]
- [news 2]
- [news 3]
**TECHNICALS:**
- [point 1]
- [point 2]
- [point 3]
**SETUP:**
Direction: [BUY/SELL/WAIT]
Entry: [price]
SL: [price] ([X] pips)
TP1: [price] ([X] pips)
TP2: [price] ([X] pips)
RR: 1:[X]
**CONFIDENCE:** [LOW/MEDIUM/HIGH/VERY HIGH] - [reason]
**SESSION:** [Asian/London/New York]
**INVALIDATION:** [price]
**ADVICE:** [1-2 sentences]`;

function md(t){if(!t)return"";return t.replace(/^## (.+)$/gm,"<b>$1</b><br/>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^[-•] (.+)$/gm,"<li>$1</li>").replace(/(<li>[\s\S]*?<\/li>)/g,"<ul>$1</ul>").replace(/\n/g,"<br/>");}
function dl(text,name){const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([text],{type:"text/plain"})),download:name});a.click();}
function sig(t){return{dir:t.match(/Direction:\s*(BUY|SELL|WAIT)/)?.[1]||"WAIT",entry:t.match(/Entry:\s*([\d.]+)/)?.[1]||null,sl:t.match(/SL:\s*([\d.]+)/)?.[1]||null,tp1:t.match(/TP1:\s*([\d.]+)/)?.[1]||null,tp2:t.match(/TP2:\s*([\d.]+)/)?.[1]||null,rr:t.match(/RR:\s*1:([\d.]+)/)?.[1]||null};}
function b64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});}
async function ai(body){const r=await fetch(EP,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();return d.content?.map(b=>b.text||"").join("")||"No response.";}

function Approve({p,onApprove}){
  if(!p)return null;
  return(
    <div className="appsec">
      <div className="apptitle">PAPER TRADE - ONE TAP</div>
      <div className="appgrid">
        <div className="apf"><div className="apfl">Entry</div><div className="apfv e">{p.entry||"—"}</div></div>
        <div className="apf"><div className="apfl">SL</div><div className="apfv s">{p.sl||"—"}</div></div>
        <div className="apf"><div className="apfl">TP2</div><div className="apfv t">{p.tp2||"—"}</div></div>
      </div>
      <button className={"appbtn "+(p.dir==="BUY"?"buy":p.dir==="SELL"?"sell":"wait")} onClick={onApprove} disabled={p.dir==="WAIT"}>
        {p.dir==="WAIT"?"WAIT - NO SETUP":"APPROVE "+p.dir+" TRADE"}
      </button>
    </div>
  );
}

export default function Aurum(){
  const[tab,setTab]=useState("vision");
  const[price,setPrice]=useState(null);
  const[prev,setPrev]=useState(null);
  const[ps,setPs]=useState("sp");
  const[news,setNews]=useState([]);
  const[ns,setNs]=useState("sp");
  const[imgB64,setImgB64]=useState(null);
  const[imgMime,setImgMime]=useState("image/png");
  const[previewUrl,setPreview]=useState(null);
  const[imgSize,setImgSize]=useState(0);
  const[vCtx,setVCtx]=useState({session:"",notes:""});
  const[vLoad,setVLoad]=useState(false);
  const[vStep,setVStep]=useState(0);
  const[vResult,setVResult]=useState(null);
  const[vParsed,setVParsed]=useState(null);
  const[form,setForm]=useState({trend:"",pattern:"",keyLevel:"",rsi:"",session:"",bias:"",notes:""});
  const[loading,setLoading]=useState(false);
  const[signal,setSignal]=useState(null);
  const[parsed,setParsed]=useState(null);
  const[trades,setTrades]=useState([]);
  const[msgs,setMsgs]=useState([{role:"ai",text:"Hello! I am AURUM.\nTap VISION tab, tap GALLERY, pick your XAUUSD chart screenshot, then tap ANALYZE!"}]);
  const[chatIn,setChatIn]=useState("");
  const[chatLoad,setChatLoad]=useState(false);
  const chatEnd=useRef(null);

  const fetchPrice=useCallback(async()=>{
    setPs("sp");
    try{
      const r=await fetch(PX+"https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1m&range=1d");
      const d=await r.json();
      const m=d?.chart?.result?.[0]?.meta;
      if(m?.regularMarketPrice){setPrice(m.regularMarketPrice.toFixed(2));setPrev(m.previousClose?.toFixed(2));setPs("ok");}
      else throw new Error();
    }catch{setPs("err");}
  },[]);

  const fetchNews=useCallback(async()=>{
    setNs("sp");
    try{
      const r=await fetch(PX+"https://newsapi.org/v2/everything?q=gold+XAUUSD+fed&language=en&sortBy=publishedAt&pageSize=8&apiKey="+NK);
      const d=await r.json();
      if(d.articles?.length){setNews(d.articles.slice(0,8));setNs("ok");return;}
      throw new Error();
    }catch{setNs("err");}
  },[]);

  useEffect(()=>{fetchPrice();fetchNews();},[]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const chg=price&&prev?(parseFloat(price)-parseFloat(prev)).toFixed(2):null;
  const pct=price&&prev?(((parseFloat(price)-parseFloat(prev))/parseFloat(prev))*100).toFixed(2):null;
  const pdir=chg>0?"up":chg<0?"dn":"fl";

  const handleFile=async(file)=>{
    if(!file||!file.type.startsWith("image/"))return;
    setImgMime(file.type);setImgSize(file.size);
    setPreview(URL.createObjectURL(file));
    const x=await b64(file);
    setImgB64(x);setVResult(null);setVParsed(null);
  };
  const onFC=(e)=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value="";};

  const runVision=async()=>{
    if(!imgB64)return;
    setVLoad(true);setVResult(null);setVParsed(null);setVStep(1);
    const nc=news.length?"\n\nLIVE NEWS:\n"+news.slice(0,3).map(n=>"- "+n.title).join("\n"):"";
    const pc=price?"\n\nLIVE XAUUSD: $"+price:"";
    const ec=[vCtx.session&&"Session: "+vCtx.session,vCtx.notes&&"Notes: "+vCtx.notes].filter(Boolean).join("\n");
    setTimeout(()=>setVStep(2),1500);setTimeout(()=>setVStep(3),3000);
    try{
      const text=await ai({
        model:"claude-sonnet-4-20250514",max_tokens:1200,system:VP,
        messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:imgMime,data:imgB64}},
          {type:"text",text:"Analyze this XAUUSD chart."+pc+nc+(ec?"\n\n"+ec:"")}
        ]}]
      });
      setVResult({text,ts:new Date().toLocaleTimeString(),date:new Date().toLocaleDateString(),price:price||"—"});
      setVParsed(sig(text));
    }catch(e){setVResult({text:"Error: "+e.message,ts:new Date().toLocaleTimeString(),price:"—"});}
    setVLoad(false);setVStep(0);
  };

  const runAnalysis=async()=>{
    setLoading(true);setSignal(null);setParsed(null);
    const parts=[];
    if(price)parts.push("LIVE XAUUSD: $"+price);
    if(news.length)parts.push("NEWS:\n"+news.slice(0,3).map(n=>"- "+n.title).join("\n"));
    if(form.trend)parts.push("Trend: "+form.trend);
    if(form.bias)parts.push("Bias: "+form.bias);
    if(form.pattern)parts.push("Pattern: "+form.pattern);
    if(form.keyLevel)parts.push("Key Level: "+form.keyLevel);
    if(form.rsi)parts.push("RSI: "+form.rsi);
    if(form.session)parts.push("Session: "+form.session);
    if(form.notes)parts.push("Notes: "+form.notes);
    try{
      const text=await ai({model:"claude-sonnet-4-20250514",max_tokens:1000,system:TP,messages:[{role:"user",content:parts.join("\n\n")||"Full XAUUSD analysis."}]});
      setSignal({text,ts:new Date().toLocaleTimeString(),date:new Date().toLocaleDateString(),price:price||"—"});
      setParsed(sig(text));
    }catch{setSignal({text:"Connection error.",ts:"",price:"—"});}
    setLoading(false);
  };

  const approveTrade=(p,src)=>{
    if(!p||p.dir==="WAIT")return;
    setTrades(t=>[{id:Date.now(),...p,src,openAt:new Date().toLocaleTimeString(),openDate:new Date().toLocaleDateString(),status:"open",pips:null},...t]);
    setTab("journal");
  };

  const closeTrade=(id,outcome)=>setTrades(t=>t.map(tr=>{
    if(tr.id!==id)return tr;
    let pips=0;
    if(outcome==="win"&&tr.tp2&&tr.entry)pips=tr.dir==="BUY"?Math.round((parseFloat(tr.tp2)-parseFloat(tr.entry))*10):Math.round((parseFloat(tr.entry)-parseFloat(tr.tp2))*10);
    if(outcome==="loss"&&tr.sl&&tr.entry)pips=tr.dir==="BUY"?Math.round((parseFloat(tr.sl)-parseFloat(tr.entry))*10):Math.round((parseFloat(tr.entry)-parseFloat(tr.sl))*10);
    return{...tr,status:outcome,pips,closeAt:new Date().toLocaleTimeString()};
  }));

  const closed=trades.filter(t=>t.status!=="open");
  const wins=trades.filter(t=>t.status==="win").length;
  const losses=trades.filter(t=>t.status==="loss").length;
  const winRate=closed.length?Math.round((wins/closed.length)*100):0;
  const totPips=trades.reduce((s,t)=>s+(t.pips||0),0);

  const sendChat=async()=>{
    if(!chatIn.trim()||chatLoad)return;
    const msg=chatIn.trim();setChatIn("");setChatLoad(true);
    setMsgs(m=>[...m,{role:"user",text:msg}]);
    try{
      const hist=msgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
      const ctx=price?"XAUUSD=$"+price:"";
      const text=await ai({model:"claude-sonnet-4-20250514",max_tokens:800,system:TP+"\n\nLIVE:"+ctx+"\nBe concise.",messages:[...hist,{role:"user",content:msg}]});
      setMsgs(m=>[...m,{role:"ai",text}]);
    }catch{setMsgs(m=>[...m,{role:"ai",text:"Error."}]);}
    setChatLoad(false);
  };

  const impactOf=n=>{const t=(n.title||"").toLowerCase();if(["fed","fomc","nfp","cpi","war","rate"].some(k=>t.includes(k)))return"high";if(["gold","xau","dollar","yield","inflation"].some(k=>t.includes(k)))return"medium";return"forex";};
  const STEPS=["Uploading chart...","Reading patterns...","Calculating signal..."];

  return(
    <div className="root">
      <div className="wrap">

        <div className="hdr">
          <div className="logo-row">
            <div className="gem">&#x26DC;</div>
            <div className="logotxt">AURUM</div>
          </div>
          <div className="logsub">AI Gold Analyst · Vision · XAUUSD</div>
          <div className="prow">
            {ps==="sp"&&<span style={{fontSize:10,color:"rgba(212,175,55,.28)"}}>LOADING...</span>}
            {ps==="ok"&&<>
              <div className="pval">$ {price}</div>
              {chg&&<div className={"pchg "+pdir}>{chg>0?"+":""}{chg} ({pct}%)</div>}
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"rgba(52,211,153,.55)",letterSpacing:2}}>
                <div className="ldot"/>LIVE
              </div>
            </>}
            {ps==="err"&&<span style={{fontSize:10,color:"rgba(239,68,68,.4)"}}>Manual mode</span>}
          </div>
          <div className="chips">
            <div className="chip"><div className={"cdot "+(ps==="ok"?"ok":"err")}/>Yahoo</div>
            <div className="chip"><div className={"cdot "+(ns==="ok"?"ok":"err")}/>News</div>
            <div className="chip"><div className="cdot ok"/>Claude</div>
          </div>
          <button className="rfbtn" onClick={()=>{fetchPrice();fetchNews();}}>REFRESH</button>
        </div>

        <div className="tabs">
          {[["vision","VISION","von"],["analyze","ANALYZE",""],["journal","JOURNAL",""],["news","NEWS",""],["chat","CHAT",""]].map(([id,lbl,ex])=>(
            <button key={id} className={"tab "+(ex||"")+" "+(tab===id?"on":"")} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>

        {tab==="vision"&&(
          <div className="vwrap">
            <div className="vhero">
              <span className="vicon">&#128065;</span>
              <div className="vtitle">AURUM VISION</div>
              <div className="vsub">Upload your XAUUSD chart screenshot. AURUM reads every pattern, RSI, levels and gives Entry, SL, TP automatically.</div>
            </div>

            {!previewUrl&&(
              <div>
                <div className="steps">
                  <div className="sttl">HOW TO USE</div>
                  {[["1","Open TradingView, search XAUUSD, set H1 or H4"],["2","Add RSI indicator and take a screenshot"],["3","Tap GALLERY below and select the screenshot"],["4","Tap ANALYZE and get your complete signal"]].map(([n,t])=>(
                    <div key={n} className="step"><div className="snum">{n}</div><div className="stxt">{t}</div></div>
                  ))}
                </div>
                <div className="ubtnrow">
                  <label className="ubtn gal">
                    <input type="file" accept="image/*" onChange={onFC}/>
                    <span className="ubtn-icon">&#128444;</span>
                    <span className="ubtn-lbl">GALLERY</span>
                    <span className="ubtn-sub">Pick screenshot</span>
                  </label>
                  <label className="ubtn cam">
                    <input type="file" accept="image/*" capture="environment" onChange={onFC}/>
                    <span className="ubtn-icon">&#128247;</span>
                    <span className="ubtn-lbl">CAMERA</span>
                    <span className="ubtn-sub">Take live photo</span>
                  </label>
                </div>
                <div className="or-row"><div className="or-line"/><div className="or-txt">OR</div><div className="or-line"/></div>
                <label className="ubtn-full">
                  <input type="file" accept="image/*" onChange={onFC}/>
                  <div className="ubtn-full-txt">BROWSE ANY IMAGE FILE</div>
                </label>
              </div>
            )}

            {previewUrl&&(
              <div>
                <div className="prev">
                  <img src={previewUrl} alt="Chart"/>
                  <div className="prev-bar">
                    <div className="prev-info">Ready - {(imgSize/1024).toFixed(0)}KB</div>
                    <div className="prev-btns">
                      <label className="prev-btn chg"><input type="file" accept="image/*" onChange={onFC}/>Change</label>
                      <button className="prev-btn rem" onClick={()=>{setPreview(null);setImgB64(null);setVResult(null);setVParsed(null);}}>Remove</button>
                    </div>
                  </div>
                </div>
                <div className="ctx">
                  <div className="ctxt">Context (Optional)</div>
                  <div className="cgrid">
                    <div>
                      <div className="ilbl">Session</div>
                      <select className="sel" value={vCtx.session} onChange={e=>setVCtx(v=>({...v,session:e.target.value}))}>
                        <option value="">Select...</option>
                        {["Asian","London","New York"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="ilbl">Price</div>
                      <input className="inp" value={price||""} readOnly style={{opacity:.5}}/>
                    </div>
                  </div>
                  <div className="ilbl" style={{marginBottom:3}}>Notes</div>
                  <textarea className="ta" placeholder="Anything extra..." value={vCtx.notes} onChange={e=>setVCtx(v=>({...v,notes:e.target.value}))}/>
                </div>
                <button className="vabtn" onClick={runVision} disabled={vLoad||!imgB64}>
                  {vLoad?"READING CHART...":"ANALYZE MY CHART"}
                </button>
              </div>
            )}

            {vLoad&&(
              <div className="lcard vc">
                <div className="lorb"/>
                <div className="ltxt">AURUM READING</div>
                <div className="lprog">
                  {STEPS.map((s,i)=>(
                    <div key={i} className={"lprow "+(vStep>i+1?"done":vStep===i+1?"act":"")}>
                      <div className="lpdot"/>{s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vResult&&!vLoad&&(
              <div>
                <div className="rcard vc">
                  <div className="rhdr vc">
                    <div>
                      <div style={{fontSize:8,color:"rgba(139,92,246,.38)",marginBottom:2}}>VISION - {vResult.date}</div>
                      <div className="rtitle v">AURUM READING</div>
                    </div>
                    <div className="rhr">
                      <div className="rts v">{vResult.ts}</div>
                      <button className="svbtn" onClick={()=>dl(vResult.text,"AURUM-Vision.txt")}>SAVE</button>
                    </div>
                  </div>
                  <div className="rbody" dangerouslySetInnerHTML={{__html:md(vResult.text)}}/>
                </div>
                <Approve p={vParsed} onApprove={()=>approveTrade(vParsed,"vision")}/>
              </div>
            )}

            <div className="disc">Paper trading only. Educational tool. Never risk real money without experience.</div>
          </div>
        )}

        {tab==="analyze"&&(
          <div>
            <div className="fcard">
              <div className="fsec">
                <div className="slbl">Market Data</div>
                <div className="igrid">
                  <div className="iwrap"><div className="ilbl">S/R Level</div><input className="inp" placeholder="3020.00" value={form.keyLevel} onChange={e=>setForm(f=>({...f,keyLevel:e.target.value}))}/></div>
                  <div className="iwrap"><div className="ilbl">RSI</div><input className="inp" placeholder="65" value={form.rsi} onChange={e=>setForm(f=>({...f,rsi:e.target.value}))}/></div>
                  <div className="iwrap">
                    <div className="ilbl">Trend</div>
                    <select className="sel" value={form.trend} onChange={e=>setForm(f=>({...f,trend:e.target.value}))}>
                      <option value="">Select...</option>
                      {["Uptrend","Downtrend","Ranging"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="iwrap">
                    <div className="ilbl">Session</div>
                    <select className="sel" value={form.session} onChange={e=>setForm(f=>({...f,session:e.target.value}))}>
                      <option value="">Select...</option>
                      {["Asian","London","New York"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="fsec">
                <div className="slbl">Bias</div>
                <div className="bias-row">
                  {[["bull","BULL","bullish"],["neut","NEUT","neutral"],["bear","BEAR","bearish"]].map(([c,l,v])=>(
                    <button key={v} className={"bbtn "+c+" "+(form.bias===v?"on":"")} onClick={()=>setForm(f=>({...f,bias:f.bias===v?"":v}))}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="fsec">
                <div className="slbl">Notes</div>
                <textarea className="ta" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="What you see on chart..."/>
              </div>
            </div>
            <button className="abtn" onClick={runAnalysis} disabled={loading}>{loading?"ANALYSING...":"RUN ANALYSIS"}</button>
            {loading&&<div className="lcard gc"><div className="lorb g"/><div className="ltxt g">Reading...</div></div>}
            {signal&&!loading&&(
              <div>
                <div c
