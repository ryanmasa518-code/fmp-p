const BASE = "https://financialmodelingprep.com/stable";

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing FMP_API_KEY" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const symbols = url.searchParams.get("symbol");
  if (!symbols) return res.status(400).json({ error: "symbol is required (e.g., AAPL or AAPL,MSFT)" });

  const list = symbols.split(",").map(s => s.trim()).filter(Boolean);
  const results = [];

  for (const sym of list) {
    const r = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(sym)}&apikey=${key}`);
    if (r.ok) {
      const data = await r.json();
      results.push(...data); // FMPは配列で返すので展開
    } else {
      results.push({ symbol: sym, error: `status ${r.status}` });
    }
  }

  res.status(200).json(results);
}
