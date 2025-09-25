// api/[...path].js
const BASE = "https://financialmodelingprep.com/api/v3";

function withCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  withCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const apikey = process.env.FMP_API_KEY;
  if (!apikey) return res.status(500).json({ error: "Missing FMP_API_KEY env var" });

  // アクセスされた実パスを取得（例: /api/quote）
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.replace(/^\/api/, "") || "/"; // 例: "/quote"
  const q = url.searchParams;

  async function forward(path, extraParams = {}) {
    const out = new URL(BASE + path);
    for (const [k, v] of q.entries()) out.searchParams.set(k, v);
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== null && v !== "") out.searchParams.set(k, String(v));
    }
    out.searchParams.set("apikey", apikey);

    const r = await fetch(out.toString());
    const body = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.send(body);
  }

  try {
    switch (pathname) {
      case "/quote": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/quote/${encodeURIComponent(symbol)}`);
      }
      case "/profile": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/profile/${encodeURIComponent(symbol)}`);
      }
      case "/income-statement": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/income-statement/${encodeURIComponent(symbol)}`);
      }
      case "/historical": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/historical-price-full/${encodeURIComponent(symbol)}`);
      }
      case "/key-metrics": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/key-metrics/${encodeURIComponent(symbol)}`);
      }
      case "/search": {
        return forward(`/search`);
      }
      case "/":
        return res.status(200).json({
          ok: true,
          message: "FMP proxy is up.",
          routes: [
            "/api/quote?symbol=AAPL",
            "/api/profile?symbol=AAPL",
            "/api/income-statement?symbol=AAPL&period=quarter",
            "/api/historical?symbol=AAPL&from=2024-01-01&to=2025-09-20",
            "/api/key-metrics?symbol=AAPL&limit=40",
            "/api/search?query=apple&limit=10&exchange=NASDAQ",
          ],
        });
      default:
        return res.status(404).json({ error: "Not Found", path: pathname });
    }
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Upstream error", detail: String(e) });
  }
}
