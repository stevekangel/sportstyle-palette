"use client";
import { useState, useCallback, useMemo } from "react";

// ASICS SPORTSTYLE BRAND TOKENS
const B = {
  black: "#0A0A0A",
  yellow: "#FFD700",
  grey: "#E8E8E8",
  white: "#FFFFFF",
  midGrey: "#6B6B6B",
  lineGrey: "#D4D4D4",
};

// ASICS GEL-CUMULUS 16 COLORWAYS
const COLORWAYS = [
  { name: "Cream/Ivory", sku: "1203A763-100", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A763-100.html", colors: ["#F5F0E0", "#FFFFF0", "#D4C9A8"], description: "Warm cream and ivory throughout a soft, tonal neutral with no bold contrast." },
  { name: "Cloud Grey/Bisque", sku: "1203A763-020", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A763-020.html", colors: ["#B0ADA8", "#D2C4B0", "#9A9690"], description: "Muted cool grey base with warm bisque overlays understated and earthy." },
  { name: "Cream/Clay Grey", sku: "1203A733-101", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-101.html", colors: ["#EDE5D0", "#A89880", "#8C8278"], description: "Cream upper with warm clay-grey overlays tonal and textural." },
  { name: "Oatmeal/White", sku: "1203A733-300", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-300.html", colors: ["#E8DFC8", "#F8F8F0", "#C8C0A8"], description: "Soft oatmeal mesh with clean white warm and minimal." },
  { name: "White/Midnight", sku: "1203A733-103", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-103.html", colors: ["#F0F0F0", "#1A2040", "#8090C0"], description: "Crisp white base with deep midnight navy high contrast and clean." },
  { name: "Port Royal", sku: "1203A733-600", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A733-600.html", colors: ["#5C3060", "#7A4080", "#402048"], description: "Rich monochromatic deep purple bold and moody." },
  { name: "Black/Black (SSCB)", sku: "1203A762-001", url: "https://www.asics.com/us/en-us/gel-cumulus-16-sscb/p/ANA_1203A762-001.html", colors: ["#1A1A1A", "#2A2A2A", "#383838"], description: "Cecilie Bahnsen Signature Series all black with sheer floral mesh overlays." },
  { name: "Cloud Grey/Floral (SSCB)", sku: "1203A762-020", url: "https://www.asics.com/us/en-us/gel-cumulus-16-sscb/p/ANA_1203A762-020.html", colors: ["#C0BDB8", "#D8D4CE", "#E8E4DE"], description: "Cecilie Bahnsen Signature Series soft grey with sheer floral mesh." },
  { name: "Ivory/Beige (emmi)", sku: "1203A957-250", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A957-250.html", colors: ["#F0EAD8", "#7A5C40", "#A0A098"], description: "emmi collab cream mesh, chocolate overlays, grey panelling, lime green hits." },
  { name: "Cream/Cobalt", sku: "1203A990-100", url: "https://www.asics.com/us/en-us/gel-cumulus-16/p/ANA_1203A990-100.html", colors: ["#EDE5D0", "#2050C0", "#C03020"], description: "Cream base with bold cobalt and red vibrant summer energy." },
];

// COLOR MATCHING
function colorDist(h1, h2) {
  const r = (n, p) => parseInt(n.slice(p, p + 2), 16);
  return Math.sqrt(["1", "3", "5"].map((_, i) => (r(h1, 1 + i * 2) - r(h2, 1 + i * 2)) ** 2).reduce((a, b) => a + b, 0));
}
function scoreColorway(cw, palette) {
  const total = cw.colors.reduce((s, sc) => s + Math.min(...palette.map(p => colorDist(sc, p.hex))), 0);
  return total / cw.colors.length;
}
function rankColorways(palette) {
  return [...COLORWAYS].map(cw => ({ ...cw, score: scoreColorway(cw, palette) })).sort((a, b) => a.score - b.score);
}
function matchPct(score) {
  return Math.round(Math.max(0, Math.min(100, 100 - score / 4.4)));
}

// PROFILE PARSER - splits on known category labels regardless of newlines
function parseProfile(text) {
  const clean = text.replace(/\*\*/g, "").replace(/\\n/g, " ").trim();
  const LABELS = ["Favorite Fit", "Creative Colors", "Sportstyle Options"];
  // Split on "Label:" pattern, keeping the delimiters
  const regex = new RegExp(`(${LABELS.join("|")}):`, "g");
  const parts = clean.split(regex).map(s => s.trim()).filter(Boolean);
  // parts[0] = headline text, then: label, body, label, body, ...
  const headline = parts[0] || "";
  const categories = [];
  for (let i = 1; i < parts.length; i += 2) {
    if (LABELS.includes(parts[i])) {
      categories.push({ label: parts[i], body: (parts[i + 1] || "").trim() });
    }
  }
  return { headline, categories };
}

const LABEL_COLORS = {
  "Favorite Fit": "#FFD700",
  "Creative Colors": "#4A90D9",
  "Sportstyle Options": "#50C878",
};

// SNEAKER IMAGE
function skuImg(sku) {
  return `https://images.asics.com/is/image/asics/${sku.replace(/-/g, "_")}_SB_FR_GLB?$sfcc-product$`;
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

  const apiFetch = useCallback(async (body, retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const r = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.status === 429) {
        if (attempt < retries) {
          setStatusMsg(`Rate limited, retrying in 35 seconds (${attempt + 1}/${retries})`);
          await new Promise(res => setTimeout(res, 35000));
          continue;
        }
        throw new Error("Still rate limited after retries, please wait a minute and try again.");
      }
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    }
  }, []);

  const run = useCallback(async () => {
    const h = handle.trim().replace(/^@/, "");
    if (!h || loading) return;
    setLoading(true);
    setError("");
    setPalette([]);
    setAestheticDesc("");
    setDone(false);
    setExpandAll(false);
    setStatusMsg("Searching style...");
    try {
      const d1 = await apiFetch({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "You are a fashion editor specializing in retro sports aesthetic and sportstyle culture. You MUST call web_search before responding. Write confidently based on your best read of their style. NEVER explain what you found or did not find in your search. NEVER mention follower counts, bios, or search results. Output ONLY the four profile elements with zero preamble or meta-commentary.",
        messages: [{
          role: "user",
          content: `Use web_search to research the fashion aesthetic and personal style of ${h} (Instagram: @${h}). Search for "${h} instagram outfits" and "${h} fashion style". Write a short style profile in EXACTLY this format - use these exact label names followed by a colon:

[Their name] [a vivid phrase using current retro-sports-aesthetic vocabulary]

Favorite Fit: [One sentence on their go-to outfit formula]

Creative Colors: [One sentence creatively describing their color palette]

Sportstyle Options: ASICS GEL-Cumulus 16 [best matching colorway from: Cream/Ivory, Cloud Grey/Bisque, Cream/Clay Grey, Oatmeal/White, White/Midnight, Port Royal, Black/Black, Cloud Grey/Floral, Ivory/Beige, Cream/Cobalt], plus 1-2 other ASICS Sportstyle model names

Four elements only. No caveats, no hedging, no extra sentences.`
        }],
      });
      const aText = d1.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      setAestheticDesc(aText);
      setStatusMsg("Generating palette...");

      const d2 = await apiFetch({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: "Output ONLY a raw JSON array. No markdown. No backticks. No explanation. Start with [ end with ].",
        messages: [{
          role: "user",
          content: `Based on this fashion aesthetic, output a JSON array of 8 colors:\n\n${aText}\n\nFormat: [{"hex":"#RRGGBB","name":"Color Name"},...]\nOnly the array. Start with [, end with ].`
        }],
      });
      const pText = d2.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      let pal = [];
      try {
        const s = pText.indexOf("["), e = pText.lastIndexOf("]") + 1;
        if (s === -1) throw new Error();
        pal = JSON.parse(pText.slice(s, e)).filter(c => c.hex && /^#[0-9a-fA-F]{6}$/.test(c.hex));
      } catch {
        throw new Error("Palette generation failed, please try again.");
      }
      if (pal.length < 3) throw new Error("Not enough colors generated. Try again.");
      setPalette(pal);
      setDone(true);
      setStatusMsg("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatusMsg("");
    }
    setLoading(false);
  }, [handle, loading, apiFetch]);

  const profile = aestheticDesc ? parseProfile(aestheticDesc) : null;

  return (
    <div style={{ fontFamily: "'Arial', 'Helvetica Neue', Helvetica, sans-serif", background: B.white, minHeight: "100vh", color: B.black }}>

      {/* HEADER */}
      <div style={{ background: B.black, padding: "0 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src="data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/Z" alt="ASICS" style={{ height: 28, display: "block" }} />
            <span style={{ width: 1, height: 20, background: B.midGrey, display: "inline-block" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.white }}>Sportstyle Palette</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: B.midGrey }}>GEL-CUMULUS 16 Color Match</div>
        </div>
      </div>
      <div style={{ height: 4, background: B.yellow }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px" }}>

        {/* INPUT */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.midGrey, marginBottom: 10 }}>Instagram Handle</div>
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ background: B.grey, border: `1px solid ${B.lineGrey}`, borderRight: "none", padding: "0 16px", display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, color: B.midGrey }}>@</div>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && run()}
              placeholder="instagramhandle"
              style={{ flex: 1, background: B.white, border: `1px solid ${B.lineGrey}`, padding: "13px 18px", fontSize: 14, fontWeight: 400, color: B.black, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={run} disabled={loading} style={{ background: loading ? B.grey : B.yellow, color: B.black, border: "none", padding: "13px 32px", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "Working..." : "Generate"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: B.midGrey, letterSpacing: "0.04em", marginBottom: 44 }}>
          Discover your signature sneaker match. Enter any Instagram handle below and we'll analyze their style, extract a personal color palette, and find the perfect ASICS GEL-Cumulus 16 colorway for them.
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ background: "#FFF3F3", border: "1px solid #F0C0C0", padding: "12px 18px", fontSize: 12, color: "#C00", marginBottom: 32, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: B.yellow, animation: "pulse 1s ease-in-out infinite" }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey }}>{statusMsg}</div>
          </div>
        )}

        {/* AESTHETIC PROFILE */}
        {profile && (
          <div style={{ marginBottom: 44, borderLeft: `3px solid ${B.yellow}`, paddingLeft: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 12 }}>
              Aesthetic Profile @{handle.replace(/^@/, "")}
            </div>

            {/* HEADLINE */}
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.3px", color: B.black, marginBottom: 20, lineHeight: 1.3 }}>
              {profile.headline}
            </div>

            {/* CATEGORIES */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {profile.categories.map((cat, i) => (
                <div key={i} style={{ borderTop: `1px solid ${B.lineGrey}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: LABEL_COLORS[cat.label] || B.yellow, marginBottom: 5 }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 15, color: B.black, lineHeight: 1.65 }}>
                    {cat.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COLOR PALETTE */}
        {palette.length > 0 && (
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 14 }}>Extracted Color Palette</div>
            <div style={{ display: "flex", height: 52, marginBottom: 14, border: `1px solid ${B.lineGrey}` }}>
              {palette.map((c, i) => (
                <div key={i} title={`${c.name} ${c.hex}`} style={{ flex: 1, background: c.hex, transition: "flex 0.3s ease", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.flex = "2.5"}
                  onMouseLeave={e => e.currentTarget.style.flex = "1"}
                />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${palette.length}, 1fr)`, gap: 4 }}>
              {palette.map((c, i) => {
                const rv = parseInt(c.hex.slice(1, 3), 16), gv = parseInt(c.hex.slice(3, 5), 16), bv = parseInt(c.hex.slice(5, 7), 16);
                const luma = rv * 0.299 + gv * 0.587 + bv * 0.114;
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

        {/* ASICS MATCH */}
        {done && best && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: B.midGrey, marginBottom: 20 }}>GEL-Cumulus 16 Recommended Colorway</div>
            <div style={{ border: `2px solid ${B.black}`, display: "grid", gridTemplateColumns: "260px 1fr", marginBottom: 16 }}>
              <div style={{ background: B.grey, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", borderRight: `2px solid ${B.black}` }}>
                <Sneaker colorway={best} size={230} />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {best.colors.map((c, i) => (
                    <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: `1px solid ${B.lineGrey}` }} />
                  ))}
                </div>
              </div>
              <div style={{ padding: "24px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: B.yellow, color: B.black, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px" }}>Best Match</div>
                  <div style={{ fontSize: 10, color: B.midGrey, letterSpacing: "0.06em", fontFamily: "monospace" }}>#{best.sku}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>{best.name}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "#444", marginBottom: 18 }}>{best.description}</div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey }}>Palette Match</span>
                    <span style={{ fontSize: 10, fontWeight: 800 }}>{matchPct(best.score)}%</span>
                  </div>
                  <div style={{ height: 4, background: B.grey }}>
                    <div style={{ height: "100%", background: B.yellow, width: `${matchPct(best.score)}%`, transition: "width 1.2s ease" }} />
                  </div>
                </div>
                <a href={best.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: B.black, color: B.white, padding: "11px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", fontFamily: "inherit" }}>
                  Shop on ASICS.com
                </a>
              </div>
            </div>

            <button onClick={() => setExpandAll(v => !v)} style={{ background: "transparent", border: `1px solid ${B.lineGrey}`, padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: B.midGrey, cursor: "pointer", marginBottom: 14, fontFamily: "inherit" }}>
              {expandAll ? "Hide all colorways" : "All colorways ranked"}
            </button>

            {expandAll && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                {ranked.slice(1).map((cw) => (
                  <a key={cw.sku} href={cw.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", border: `1px solid ${B.lineGrey}`, padding: "16px", textDecoration: "none", color: "inherit", background: B.white }}>
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

      {/* FOOTER */}
      <div style={{ background: B.black, borderTop: `4px solid ${B.yellow}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.yellow }}>ASICS Sportstyle Palette</span>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", color: B.midGrey }}>GEL-CUMULUS 16 $140</span>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.6);opacity:1}}`}</style>
    </div>
  );
}
