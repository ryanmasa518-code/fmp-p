const BASE = "https://financialmodelingprep.com/stable";
export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing FMP_API_KEY" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const sp = url.searchParams;
  const symbol = sp.get("symbol");
  if (!symbol) return res.status(400).json({ error: "symbol is required" });

  // from, to など任意
  const out = `${BASE}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&${sp}&apikey=${key}`;
  const r = await fetch(out);
  const body = await r.text();
  res.status(r.status).setHeader("Content-Type", "application/json").send(body);
}
