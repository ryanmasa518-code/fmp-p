const BASE = "https://financialmodelingprep.com/api/v3";

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing FMP_API_KEY" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const symbol = url.searchParams.get("symbol");
  if (!symbol) return res.status(400).json({ error: "symbol is required" });

  const r = await fetch(`${BASE}/profile/${encodeURIComponent(symbol)}?apikey=${key}`);
  const body = await r.text();
  res.status(r.status).setHeader("Content-Type", "application/json").send(body);
}
