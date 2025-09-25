const BASE = "https://financialmodelingprep.com/stable";

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing FMP_API_KEY" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const sp = url.searchParams;
  const symbol = sp.get("symbol");
  if (!symbol) return res.status(400).json({ error: "symbol is required" });

  const out = new URL(`${BASE}/historical-price-eod/full`);
  out.searchParams.set("symbol", symbol);
  if (sp.has("from")) out.searchParams.set("from", sp.get("from"));
  if (sp.has("to")) out.searchParams.set("to", sp.get("to"));
  out.searchParams.set("apikey", key);

  const r = await fetch(out.toString());
  const body = await r.text();
  res.status(r.status).setHeader("Content-Type", "application/json").send(body);
}
