// Vercel Serverless Function (Node.js)
// 対応エンドポイント：
//   GET /api/quote?symbol=AAPL
//   GET /api/profile?symbol=AAPL
//   GET /api/income-statement?symbol=AAPL&period=quarter
//   GET /api/historical?symbol=AAPL&from=2024-01-01&to=2025-09-20
//   GET /api/key-metrics?symbol=AAPL&limit=40
//   GET /api/search?query=apple&limit=10&exchange=NASDAQ
//
// 環境変数: FMP_API_KEY（Vercelのプロジェクト設定で指定）

const BASE = "https://financialmodelingprep.com/api/v3";

// CORS ヘッダ（Actionsとの相性◎）
function withCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  withCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname; // 例: /api/quote
  const q = url.searchParams;

  const apikey = process.env.FMP_API_KEY;
  if (!apikey) {
    return res.status(500).json({ error: "Missing FMP_API_KEY env var" });
  }

  // ユーティリティ：FMPへ転送
  async function forward(path, extraParams = {}) {
    const out = new URL(BASE + path);
    // 既存のクエリをそのまま転送
    for (const [k, v] of q.entries()) out.searchParams.set(k, v);
    // 上書き・追加
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== null && v !== "") {
        out.searchParams.set(k, String(v));
      }
    }
    // FMPのapikeyは常に付与
    out.searchParams.set("apikey", apikey);

    const r = await fetch(out.toString(), { method: "GET" });
    const text = await r.text();
    // そのまま返す（FMPのContent-Typeは application/json）
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.send(text);
  }

  try {
    switch (pathname) {
      case "/api/quote": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/quote/${encodeURIComponent(symbol)}`);
      }
      case "/api/profile": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/profile/${encodeURIComponent(symbol)}`);
      }
      case "/api/income-statement": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        // period=annual|quarter
        return forward(`/income-statement/${encodeURIComponent(symbol)}`);
      }
      case "/api/historical": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        // from/to/serietype などそのまま転送
        return forward(`/historical-price-full/${encodeURIComponent(symbol)}`);
      }
      case "/api/key-metrics": {
        const symbol = q.get("symbol");
        if (!symbol) return res.status(400).json({ error: "symbol is required" });
        return forward(`/key-metrics/${encodeURIComponent(symbol)}`);
      }
      case "/api/search": {
        // 例: /api/search?query=apple&limit=10&exchange=NASDAQ
        // FMP: /search?query=apple&limit=10&exchange=NASDAQ
        return forward(`/search`);
      }
      default:
        return res.status(404).json({
          error: "Not Found",
          routes: [
            "/api/quote?symbol=AAPL",
            "/api/profile?symbol=AAPL",
            "/api/income-statement?symbol=AAPL&period=quarter",
            "/api/historical?symbol=AAPL&from=YYYY-MM-DD&to=YYYY-MM-DD",
            "/api/key-metrics?symbol=AAPL&limit=40",
            "/api/search?query=apple&limit=10&exchange=NASDAQ",
          ],
        });
    }
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Upstream error", detail: String(e) });
  }
}
