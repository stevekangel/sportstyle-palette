import { useState, useCallback, useMemo } from "react";

//  ASICS SPORTSTYLE BRAND TOKENS 
// Pantone Process Black, Pantone Yellow, 9% black (light grey), White
const B = {
  black:  "#0A0A0A",
  yellow: "#FFD700",
  grey:   "#E8E8E8",   // ~9% black
  white:  "#FFFFFF",
  midGrey:"#6B6B6B",
  lineGrey:"#D4D4D4",
};

//  ASICS GEL-CUMULUS 16 COLORWAYS 
const COLORWAYS = [
  {
    name: "Cream/Ivory",
    sku: "1203A763-100",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A763-100.html",
    colors: ["#F5F0E0", "#FFFFF0", "#D4C9A8"],
    description: "Warm cream and ivory throughout  a soft, tonal neutral with no bold contrast.",
  },
  {
    name: "Cloud Grey/Bisque",
    sku: "1203A763-020",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A763-020.html",
    colors: ["#B0ADA8", "#D2C4B0", "#9A9690"],
    description: "Muted cool grey base with warm bisque overlays  understated and earthy.",
  },
  {
    name: "Cream/Clay Grey",
    sku: "1203A733-101",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-101.html",
    colors: ["#EDE5D0", "#A89880", "#8C8278"],
    description: "Cream upper with warm clay-grey overlays  tonal and textural.",
  },
  {
    name: "Oatmeal/White",
    sku: "1203A733-300",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-300.html",
    colors: ["#E8DFC8", "#F8F8F0", "#C8C0A8"],
    description: "Soft oatmeal mesh with clean white  warm and minimal.",
  },
  {
    name: "White/Midnight",
    sku: "1203A733-103",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-103.html",
    colors: ["#F0F0F0", "#1A2040", "#8090C0"],
    description: "Crisp white base with deep midnight navy  high contrast and clean.",
  },
  {
    name: "Port Royal",
    sku: "1203A733-600",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-600.html",
    colors: ["#5C3060", "#7A4080", "#402048"],
    description: "Rich monochromatic deep purple  bold and moody.",
  },
  {
    name: "Black/Black (SSCB)",
    sku: "1203A762-001",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16-sscb/p/ANA_1203A762-001.html",
    colors: ["#1A1A1A", "#2A2A2A", "#383838"],
    description: "Cecilie Bahnsen Signature Series  all black with sheer floral mesh overlays.",
  },
  {
    name: "Cloud Grey/Floral (SSCB)",
    sku: "1203A762-020",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16-sscb/p/ANA_1203A762-020.html",
    colors: ["#C0BDB8", "#D8D4CE", "#E8E4DE"],
    description: "Cecilie Bahnsen Signature Series  soft grey with sheer floral mesh.",
  },
  {
    name: "Ivory/Beige (emmi)",
    sku: "1203A957-250",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A957-250.html",
    colors: ["#F0EAD8", "#7A5C40", "#A0A098"],
    description: "emmi collab  cream mesh, chocolate overlays, grey panelling, lime green hits.",
  },
  {
    name: "Cream/Cobalt",
    sku: "1203A990-100",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A990-100.html",
    colors: ["#EDE5D0", "#2050C0", "#C03020"],
    description: "Cream base with bold cobalt and red  vibrant summer energy.",
  },
];

//  COLOR MATCHING 
function colorDist(h1, h2) {
  const r = (n, p) => parseInt(n.slice(p, p+2), 16);
  return Math.sqrt(["1","3","5"].map((_, i) => (r(h1,1+i*2)-r(h2,1+i*2))**2).reduce((a,b)=>a+b,0));
}
function scoreColorway(cw, palette) {
  const total = cw.colors.reduce((s, sc) => s + Math.min(...palette.map(p => colorDist(sc, p.hex))), 0);
  return total / cw.colors.length;
}
function rankColorways(palette) {
  return [...COLORWAYS].map(cw => ({ ...cw, score: scoreColorway(cw, palette) })).sort((a,b) => a.score - b.score);
}
function matchPct(score) { return Math.round(Math.max(0, Math.min(100, 100 - score / 4.4))); }

//  SNEAKER SVG 
function skuImg(sku) {
  return `https://images.asics.com/is/image/asics/${sku.replace(/-/g,"_")}_SB_FR_GLB?$sfcc-product$`;
}

function Sneaker({ colorway, size = 260 }) {
  return (
    <img
      src={skuImg(colorway.sku)}
      alt={`ASICS GEL-Cumulus 16 ${colorway.name}`}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ objectFit: "contain", display: "block" }}
      onError={e => { e.target.style.opacity = "0.3"; }}
    />
  );
}

export default function SportstylePalette() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [palette, setPalette] = useState([]);
  const [aestheticDesc, setAestheticDesc] = useState("");
  const [done, setDone] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  const ranked = useMemo(() => palette.length ? rankColorways(palette) : [], [palette]);
  const best = ranked[0];

  // Auto-retrying fetch  waits and retries on 429, up to maxRetries times
  const apiFetch = useCallback(async (body, retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const r = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.status === 429) {
        if (attempt < retries) {
          setStatusMsg(`Rate limited  retrying in 35 seconds (${attempt + 1}/${retries})`);
          await new Promise(res => setTimeout(res, 35000));
          continue;
        }
        throw new Error("Still rate limited after retries  please wait a minute and try again.");
      }
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }
  }, []);

  const run = useCallback(async () => {
    const h = handle.trim().replace(/^@/, "");
    if (!h || loading) return;
    setLoading(true); setError(""); setPalette([]); setAestheticDesc(""); setDone(false); setExpandAll(false);
    setStatusMsg("Searching aesthetic");

    try {
      // Step 1: Web search aesthetic
      const d1 = await apiFetch({
        model: "claude-sonnet-4-20250514", max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "You are a fun, enthusiastic fashion editor writing style profiles. You MUST call web_search before responding.",
        messages: [{ role: "user", content: `Use web_search to research the fashion aesthetic and personal style of "${h}". Search for "${h} fashion style" and "${h} outfits". Write a punchy, fun style profile of 4-6 sentences covering: (1) their signature color palette with specific color names, (2) their go-to outfit formulas, (3) the occasions or settings they dress for, (4) any patterns, textures or silhouettes they gravitate toward, and (5) a closing sentence capturing their overall vibe. Be specific, enthusiastic and a little playful  like a fashion editor writing about a friend.` }],
      });
      const aText = d1.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      setAestheticDesc(aText);
      setStatusMsg("Generating palette");

      // Step 2: Palette
      const d2 = await apiFetch({
        model: "claude-sonnet-4-20250514", max_tokens: 600,
        system: "Output ONLY a raw JSON array. No markdown. No backticks. No explanation. Start with [ end with ].",
        messages: [{ role: "user", content: `Based on this fashion aesthetic, output a JSON array of 8 colors:\n\n${aText}\n\nFormat: [{"hex":"#RRGGBB","name":"Color Name"},...]\nOnly the array. Start with [, end with ].` }],
      });
      const pText = d2.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      let pal = [];
      try {
        const s = pText.indexOf("["), e = pText.lastIndexOf("]") + 1;
        if (s === -1) throw new Error();
        pal = JSON.parse(pText.slice(s, e)).filter(c => c.hex && /^#[0-9a-fA-F]{6}$/.test(c.hex));
      } catch { throw new Error("Palette generation failed  please try again."); }
      if (pal.length < 3) throw new Error("Not enough colors. Try again.");
      setPalette(pal); setDone(true); setStatusMsg("");
    } catch (err) {
      setError(err.message || "Something went wrong."); setStatusMsg("");
    }
    setLoading(false);
  }, [handle, loading, apiFetch]);

  return (
    <div style={{ fontFamily: "'Arial', 'Helvetica Neue', Helvetica, sans-serif", background: B.white, minHeight: "100vh", color: B.black }}>

      {/*  HEADER  */}
      <div style={{ background: B.black, padding: "0 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.yellow }}>ASICS</span>
            <span style={{ width: 1, height: 14, background: B.midGrey, display: "inline-block", verticalAlign: "middle" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.white }}>Sportstyle Palette</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: B.midGrey }}>
            GEL-CUMULUS 16 Color Match
          </div>
        </div>
      </div>

      {/*  YELLOW ACCENT BAR  */}
      <div style={{ height: 4, background: B.yellow }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px" }}>

        {/*  INPUT  */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.midGrey, marginBottom: 10 }}>
            Instagram Handle
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ background: B.grey, border: `1px solid ${B.lineGrey}`, borderRight: "none", padding: "0 16px", display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, color: B.midGrey }}>@</div>
            <input
              value={handle} onChange={e => setHandle(e.target.value)} onKeyDown={e => e.key === "Enter" && run()}
              placeholder="instagramhandle"
              style={{ flex: 1, background: B.white, border: `1px solid ${B.lineGrey}`, padding: "13px 18px", fontSize: 14, fontWeight: 400, color: B.black, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={run} disabled={loading}
              style={{ background: loading ? B.grey : B.yellow, color: B.black, border: "none", padding: "13px 32px", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "Working" : "Generate "}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: B.midGrey, letterSpacing: "0.04em", marginBottom: 44 }}>
          Enter any public Instagram handle to extract their color palette and match to a GEL-Cumulus 16 colorway
        </div>

        {/*  ERROR  */}
        {error && (
          <div style={{ background: "#FFF3F3", border: "1px solid #F0C0C0", padding: "12px 18px", fontSize: 12, color: "#C00", marginBottom: 32, fontWeight: 500 }}>
             {error}
          </div>
        )}

        {/*  LOADING  */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: B.yellow, animation: "pulse 1s ease-in-out infinite" }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey }}>{statusMsg}</div>
          </div>
        )}

        {/*  AESTHETIC PROFILE  */}
        {aestheticDesc && (
          <div style={{ marginBottom: 44, borderLeft: `3px solid ${B.yellow}`, paddingLeft: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 8 }}>
              Aesthetic Profile  @{handle.replace(/^@/, "")}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: B.black }}>{aestheticDesc}</div>
          </div>
        )}

        {/*  COLOR PALETTE  */}
        {palette.length > 0 && (
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 14 }}>
              Extracted Color Palette
            </div>
            {/* Strip */}
            <div style={{ display: "flex", height: 52, marginBottom: 14, border: `1px solid ${B.lineGrey}` }}>
              {palette.map((c, i) => (
                <div key={i} title={`${c.name}  ${c.hex}`}
                  style={{ flex: 1, background: c.hex, transition: "flex 0.3s ease", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.flex = "2.5"}
                  onMouseLeave={e => e.currentTarget.style.flex = "1"} />
              ))}
            </div>
            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${palette.length}, 1fr)`, gap: 4 }}>
              {palette.map((c, i) => {
                const r = parseInt(c.hex.slice(1,3),16), g = parseInt(c.hex.slice(3,5),16), bv = parseInt(c.hex.slice(5,7),16);
                const luma = r*0.299 + g*0.587 + bv*0.114;
                return (
                  <div key={i} style={{ background: c.hex, padding: "10px 8px", border: `1px solid ${B.lineGrey}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: luma > 150 ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.9)", lineHeight: 1.3, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", color: luma > 150 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{c.hex}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/*  ASICS MATCH  */}
        {done && best && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey }}>
                GEL-Cumulus 16  Recommended Colorway
              </div>
            </div>

            {/* BEST MATCH */}
            <div style={{ border: `2px solid ${B.black}`, display: "grid", gridTemplateColumns: "260px 1fr", marginBottom: 16 }}>
              {/* Sneaker panel */}
              <div style={{ background: B.grey, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", borderRight: `2px solid ${B.black}` }}>
                <Sneaker colorway={best} size={230} />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {best.colors.map((c, i) => (
                    <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: `1px solid ${B.lineGrey}` }} />
                  ))}
                </div>
              </div>
              {/* Info panel */}
              <div style={{ padding: "24px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: B.yellow, color: B.black, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px" }}>
                    Best Match
                  </div>
                  <div style={{ fontSize: 10, color: B.midGrey, letterSpacing: "0.06em", fontFamily: "monospace" }}>#{best.sku}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>{best.name}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "#444", marginBottom: 18 }}>{best.description}</div>

                {/* Match bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey }}>Palette Match</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}>{matchPct(best.score)}%</span>
                  </div>
                  <div style={{ height: 4, background: B.grey }}>
                    <div style={{ height: "100%", background: B.yellow, width: `${matchPct(best.score)}%`, transition: "width 1.2s ease" }} />
                  </div>
                </div>

                <a href={best.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", background: B.black, color: B.white, padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", fontFamily: "inherit" }}>
                  Shop on ASICS.com 
                </a>
              </div>
            </div>

            {/* TOGGLE ALL COLORWAYS */}
            <button onClick={() => setExpandAll(v => !v)}
              style={{ background: "transparent", border: `1px solid ${B.lineGrey}`, padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey, cursor: "pointer", marginBottom: 14, fontFamily: "inherit" }}>
              {expandAll ? "Hide all colorways " : "All colorways ranked "}
            </button>

            {expandAll && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                {ranked.slice(1).map((cw) => (
                  <a key={cw.sku} href={cw.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", border: `1px solid ${B.lineGrey}`, padding: "16px", textDecoration: "none", color: "inherit", background: B.white }}>
                    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: B.grey, marginBottom: 12 }}>
                      <Sneaker colorway={cw} size={160} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{cw.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, height: 3, background: B.grey }}>
                        <div style={{ height: "100%", background: B.yellow, width: `${matchPct(cw.score)}%` }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: B.midGrey }}>{matchPct(cw.score)}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {cw.colors.map((c, j) => (
                        <div key={j} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: `1px solid ${B.lineGrey}` }} />
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/*  FOOTER  */}
      <div style={{ background: B.black, borderTop: `4px solid ${B.yellow}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.yellow }}>ASICS Sportstyle Palette</span>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", color: B.midGrey }}>GEL-CUMULUS 16  $140</span>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.6);opacity:1}}`}</style>
    </div>
  );
}setStatusMsg("Identifying influencer...");

    try {
      // Step 1: Resolve handle -> real name
      const d0 = await apiFetch({
        model: "claude-sonnet-4-20250514", max_tokens: 400,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "You are a research assistant. You MUST call web_search before responding. Reply with ONLY the person's full real name, nothing else. If you cannot identify them, reply with the handle as-is.",
        messages: [{ role: "user", content: 'Search for the Instagram handle "@' + h + '" to find the real person behind it. This is likely a sports, fitness, fashion or culture influencer. Search "' + h + ' instagram" and "' + h + ' influencer". Reply with ONLY their full real name (e.g. "Emma Chamberlain"). No explanation, just the name.' }],
      });
      const resolvedName = d0.content.filter(b => b.type === "text").map(b => b.text).join("").trim().replace(/[^a-zA-Z\s]/g, "").trim();
      const searchName = resolvedName.length > 2 ? resolvedName : h;
      setStatusMsg("Researching " + searchName + "'s style...");

      // Step 2: Search by real name for style content
      const d1 = await apiFetch({
        model: "claude-sonnet-4-20250514", max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "You are a fun, enthusiastic fashion editor writing style profiles. You MUST call web_search before responding.",
        messages: [{ role: "user", content: 'Use web_search to research the fashion aesthetic and personal style of ' + searchName + ' (Instagram: @' + h + '). Search for "' + searchName + ' instagram outfits" and "' + searchName + ' fashion style aesthetic". Write a punchy, fun style profile of 4-6 sentences covering: (1) their signature color palette with specific color names, (2) their go-to outfit formulas, (3) the occasions or settings they dress for, (4) any patterns, textures or silhouettes they gravitate toward, and (5) a closing sentence capturing their overall vibe. Be specific, enthusiastic and playful - like a fashion editor writing about a friend.' }],
      });
      const aText = d1.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      setAestheticDesc(aText);
      setStatusMsg("Generating palette...");mo } from "react";

//  ASICS SPORTSTYLE BRAND TOKENS 
// Pantone Process Black, Pantone Yellow, 9% black (light grey), White
const B = {
  black:  "#0A0A0A",
  yellow: "#FFD700",
  grey:   "#E8E8E8",   // ~9% black
  white:  "#FFFFFF",
  midGrey:"#6B6B6B",
  lineGrey:"#D4D4D4",
};

//  ASICS GEL-CUMULUS 16 COLORWAYS 
const COLORWAYS = [
  {
    name: "Cream/Ivory",
    sku: "1203A763-100",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A763-100.html",
    colors: ["#F5F0E0", "#FFFFF0", "#D4C9A8"],
    description: "Warm cream and ivory throughout  a soft, tonal neutral with no bold contrast.",
  },
  {
    name: "Cloud Grey/Bisque",
    sku: "1203A763-020",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A763-020.html",
    colors: ["#B0ADA8", "#D2C4B0", "#9A9690"],
    description: "Muted cool grey base with warm bisque overlays  understated and earthy.",
  },
  {
    name: "Cream/Clay Grey",
    sku: "1203A733-101",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-101.html",
    colors: ["#EDE5D0", "#A89880", "#8C8278"],
    description: "Cream upper with warm clay-grey overlays  tonal and textural.",
  },
  {
    name: "Oatmeal/White",
    sku: "1203A733-300",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-300.html",
    colors: ["#E8DFC8", "#F8F8F0", "#C8C0A8"],
    description: "Soft oatmeal mesh with clean white  warm and minimal.",
  },
  {
    name: "White/Midnight",
    sku: "1203A733-103",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-103.html",
    colors: ["#F0F0F0", "#1A2040", "#8090C0"],
    description: "Crisp white base with deep midnight navy  high contrast and clean.",
  },
  {
    name: "Port Royal",
    sku: "1203A733-600",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-600.html",
    colors: ["#5C3060", "#7A4080", "#402048"],
    description: "Rich monochromatic deep purple  bold and moody.",
  },
  {
    name: "Black/Black (SSCB)",
    sku: "1203A762-001",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16-sscb/p/ANA_1203A762-001.html",
    colors: ["#1A1A1A", "#2A2A2A", "#383838"],
    description: "Cecilie Bahnsen Signature Series  all black with sheer floral mesh overlays.",
  },
  {
    name: "Cloud Grey/Floral (SSCB)",
    sku: "1203A762-020",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16-sscb/p/ANA_1203A762-020.html",
    colors: ["#C0BDB8", "#D8D4CE", "#E8E4DE"],
    description: "Cecilie Bahnsen Signature Series  soft grey with sheer floral mesh.",
  },
  {
    name: "Ivory/Beige (emmi)",
    sku: "1203A957-250",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A957-250.html",
    colors: ["#F0EAD8", "#7A5C40", "#A0A098"],
    description: "emmi collab  cream mesh, chocolate overlays, grey panelling, lime green hits.",
  },
  {
    name: "Cream/Cobalt",
    sku: "1203A990-100",
    url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A990-100.html",
    colors: ["#EDE5D0", "#2050C0", "#C03020"],
    description: "Cream base with bold cobalt and red  vibrant summer energy.",
  },
];

//  COLOR MATCHING 
function colorDist(h1, h2) {
  const r = (n, p) => parseInt(n.slice(p, p+2), 16);
  return Math.sqrt(["1","3","5"].map((_, i) => (r(h1,1+i*2)-r(h2,1+i*2))**2).reduce((a,b)=>a+b,0));
}
function scoreColorway(cw, palette) {
  const total = cw.colors.reduce((s, sc) => s + Math.min(...palette.map(p => colorDist(sc, p.hex))), 0);
  return total / cw.colors.length;
}
function rankColorways(palette) {
  return [...COLORWAYS].map(cw => ({ ...cw, score: scoreColorway(cw, palette) })).sort((a,b) => a.score - b.score);
}
function matchPct(score) { return Math.round(Math.max(0, Math.min(100, 100 - score / 4.4))); }

//  SNEAKER SVG 
function skuImg(sku) {
  return `https://images.asics.com/is/image/asics/${sku.replace(/-/g,"_")}_SB_FR_GLB?$sfcc-product$`;
}

function Sneaker({ colorway, size = 260 }) {
  return (
    <img
      src={skuImg(colorway.sku)}
      alt={`ASICS GEL-Cumulus 16 ${colorway.name}`}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ objectFit: "contain", display: "block" }}
      onError={e => { e.target.style.opacity = "0.3"; }}
    />
  );
}

export default function SportstylePalette() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [palette, setPalette] = useState([]);
  const [aestheticDesc, setAestheticDesc] = useState("");
  const [done, setDone] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  const ranked = useMemo(() => palette.length ? rankColorways(palette) : [], [palette]);
  const best = ranked[0];

  // Auto-retrying fetch  waits and retries on 429, up to maxRetries times
  const apiFetch = useCallback(async (body, retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const r = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.status === 429) {
        if (attempt < retries) {
          setStatusMsg(`Rate limited  retrying in 35 seconds (${attempt + 1}/${retries})`);
          await new Promise(res => setTimeout(res, 35000));
          continue;
        }
        throw new Error("Still rate limited after retries  please wait a minute and try again.");
      }
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }
  }, []);

  const run = useCallback(async () => {
    const h = handle.trim().replace(/^@/, "");
    if (!h || loading) return;
    setLoading(true); setError(""); setPalette([]); setAestheticDesc(""); setDone(false); setExpandAll(false);
    setStatusMsg("Searching aesthetic");

    try {
      // Step 1: Web search aesthetic
      const d1 = await apiFetch({
        model: "claude-sonnet-4-20250514", max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "You are a fun, enthusiastic fashion editor writing style profiles. You MUST call web_search before responding.",
        messages: [{ role: "user", content: `Use web_search to research the fashion aesthetic and personal style of "${h}". Search for "${h} fashion style" and "${h} outfits". Write a punchy, fun style profile of 4-6 sentences covering: (1) their signature color palette with specific color names, (2) their go-to outfit formulas, (3) the occasions or settings they dress for, (4) any patterns, textures or silhouettes they gravitate toward, and (5) a closing sentence capturing their overall vibe. Be specific, enthusiastic and a little playful  like a fashion editor writing about a friend.` }],
      });
      const aText = d1.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      setAestheticDesc(aText);
      setStatusMsg("Generating palette");

      // Step 2: Palette
      const d2 = await apiFetch({
        model: "claude-sonnet-4-20250514", max_tokens: 600,
        system: "Output ONLY a raw JSON array. No markdown. No backticks. No explanation. Start with [ end with ].",
        messages: [{ role: "user", content: `Based on this fashion aesthetic, output a JSON array of 8 colors:\n\n${aText}\n\nFormat: [{"hex":"#RRGGBB","name":"Color Name"},...]\nOnly the array. Start with [, end with ].` }],
      });
      const pText = d2.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      let pal = [];
      try {
        const s = pText.indexOf("["), e = pText.lastIndexOf("]") + 1;
        if (s === -1) throw new Error();
        pal = JSON.parse(pText.slice(s, e)).filter(c => c.hex && /^#[0-9a-fA-F]{6}$/.test(c.hex));
      } catch { throw new Error("Palette generation failed  please try again."); }
      if (pal.length < 3) throw new Error("Not enough colors. Try again.");
      setPalette(pal); setDone(true); setStatusMsg("");
    } catch (err) {
      setError(err.message || "Something went wrong."); setStatusMsg("");
    }
    setLoading(false);
  }, [handle, loading, apiFetch]);

  return (
    <div style={{ fontFamily: "'Arial', 'Helvetica Neue', Helvetica, sans-serif", background: B.white, minHeight: "100vh", color: B.black }}>

      {/*  HEADER  */}
      <div style={{ background: B.black, padding: "0 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.yellow }}>ASICS</span>
            <span style={{ width: 1, height: 14, background: B.midGrey, display: "inline-block", verticalAlign: "middle" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.white }}>Sportstyle Palette</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: B.midGrey }}>
            GEL-CUMULUS 16 Color Match
          </div>
        </div>
      </div>

      {/*  YELLOW ACCENT BAR  */}
      <div style={{ height: 4, background: B.yellow }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px" }}>

        {/*  INPUT  */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.midGrey, marginBottom: 10 }}>
            Instagram Handle
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ background: B.grey, border: `1px solid ${B.lineGrey}`, borderRight: "none", padding: "0 16px", display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, color: B.midGrey }}>@</div>
            <input
              value={handle} onChange={e => setHandle(e.target.value)} onKeyDown={e => e.key === "Enter" && run()}
              placeholder="instagramhandle"
              style={{ flex: 1, background: B.white, border: `1px solid ${B.lineGrey}`, padding: "13px 18px", fontSize: 14, fontWeight: 400, color: B.black, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={run} disabled={loading}
              style={{ background: loading ? B.grey : B.yellow, color: B.black, border: "none", padding: "13px 32px", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "Working" : "Generate "}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: B.midGrey, letterSpacing: "0.04em", marginBottom: 44 }}>
          Enter any public Instagram handle to extract their color palette and match to a GEL-Cumulus 16 colorway
        </div>

        {/*  ERROR  */}
        {error && (
          <div style={{ background: "#FFF3F3", border: "1px solid #F0C0C0", padding: "12px 18px", fontSize: 12, color: "#C00", marginBottom: 32, fontWeight: 500 }}>
             {error}
          </div>
        )}

        {/*  LOADING  */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: B.yellow, animation: "pulse 1s ease-in-out infinite" }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey }}>{statusMsg}</div>
          </div>
        )}

        {/*  AESTHETIC PROFILE  */}
        {aestheticDesc && (
          <div style={{ marginBottom: 44, borderLeft: `3px solid ${B.yellow}`, paddingLeft: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 8 }}>
              Aesthetic Profile  @{handle.replace(/^@/, "")}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: B.black }}>{aestheticDesc}</div>
          </div>
        )}

        {/*  COLOR PALETTE  */}
        {palette.length > 0 && (
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 14 }}>
              Extracted Color Palette
            </div>
            {/* Strip */}
            <div style={{ display: "flex", height: 52, marginBottom: 14, border: `1px solid ${B.lineGrey}` }}>
              {palette.map((c, i) => (
                <div key={i} title={`${c.name}  ${c.hex}`}
                  style={{ flex: 1, background: c.hex, transition: "flex 0.3s ease", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.flex = "2.5"}
                  onMouseLeave={e => e.currentTarget.style.flex = "1"} />
              ))}
            </div>
            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${palette.length}, 1fr)`, gap: 4 }}>
              {palette.map((c, i) => {
                const r = parseInt(c.hex.slice(1,3),16), g = parseInt(c.hex.slice(3,5),16), bv = parseInt(c.hex.slice(5,7),16);
                const luma = r*0.299 + g*0.587 + bv*0.114;
                return (
                  <div key={i} style={{ background: c.hex, padding: "10px 8px", border: `1px solid ${B.lineGrey}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: luma > 150 ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.9)", lineHeight: 1.3, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", color: luma > 150 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{c.hex}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/*  ASICS MATCH  */}
        {done && best && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey }}>
                GEL-Cumulus 16  Recommended Colorway
              </div>
            </div>

            {/* BEST MATCH */}
            <div style={{ border: `2px solid ${B.black}`, display: "grid", gridTemplateColumns: "260px 1fr", marginBottom: 16 }}>
              {/* Sneaker panel */}
              <div style={{ background: B.grey, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", borderRight: `2px solid ${B.black}` }}>
                <Sneaker colorway={best} size={230} />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {best.colors.map((c, i) => (
                    <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: `1px solid ${B.lineGrey}` }} />
                  ))}
                </div>
              </div>
              {/* Info panel */}
              <div style={{ padding: "24px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: B.yellow, color: B.black, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px" }}>
                    Best Match
                  </div>
                  <div style={{ fontSize: 10, color: B.midGrey, letterSpacing: "0.06em", fontFamily: "monospace" }}>#{best.sku}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>{best.name}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "#444", marginBottom: 18 }}>{best.description}</div>

                {/* Match bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey }}>Palette Match</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}>{matchPct(best.score)}%</span>
                  </div>
                  <div style={{ height: 4, background: B.grey }}>
                    <div style={{ height: "100%", background: B.yellow, width: `${matchPct(best.score)}%`, transition: "width 1.2s ease" }} />
                  </div>
                </div>

                <a href={best.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", background: B.black, color: B.white, padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", fontFamily: "inherit" }}>
                  Shop on ASICS.com 
                </a>
              </div>
            </div>

            {/* TOGGLE ALL COLORWAYS */}
            <button onClick={() => setExpandAll(v => !v)}
              style={{ background: "transparent", border: `1px solid ${B.lineGrey}`, padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey, cursor: "pointer", marginBottom: 14, fontFamily: "inherit" }}>
              {expandAll ? "Hide all colorways " : "All colorways ranked "}
            </button>

            {expandAll && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                {ranked.slice(1).map((cw) => (
                  <a key={cw.sku} href={cw.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", border: `1px solid ${B.lineGrey}`, padding: "16px", textDecoration: "none", color: "inherit", background: B.white }}>
                    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: B.grey, marginBottom: 12 }}>
                      <Sneaker colorway={cw} size={160} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{cw.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, height: 3, background: B.grey }}>
                        <div style={{ height: "100%", background: B.yellow, width: `${matchPct(cw.score)}%` }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: B.midGrey }}>{matchPct(cw.score)}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {cw.colors.map((c, j) => (
                        <div key={j} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: `1px solid ${B.lineGrey}` }} />
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/*  FOOTER  */}
      <div style={{ background: B.black, borderTop: `4px solid ${B.yellow}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.yellow }}>ASICS Sportstyle Palette</span>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", color: B.midGrey }}>GEL-CUMULUS 16  $140</span>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.6);opacity:1}}`}</style>
    </div>
  );
}
