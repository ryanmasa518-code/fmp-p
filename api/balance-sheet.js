const BASE = "https://financialmodelingprep.com/stable";

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing FMP_API_KEY" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const sp = url.searchParams;
  const symbol = sp.get("symbol");
  if (!symbol) return res.status(400).json({ error: "symbol is required" });

  const out = new URL(`${BASE}/balance-sheet-statement`);
  out.searchParams.set("symbol", symbol);

  // optional: annual | quarter
  if (sp.has("period")) out.searchParams.set("period", sp.get("period"));

  // limit は無料プランだと最大5
  let limit = 5;
  if (sp.has("limit")) {
    const requested = parseInt(sp.get("limit"), 10);
    if (!isNaN(requested)) {
      limit = Math.min(requested, 5);
    }
  }
  out.searchParams.set("limit", limit.toString());

  out.searchParams.set("apikey", key);

  try {
    const r = await fetch(out.toString());
    const body = await r.text();
    res.status(r.status)
       .setHeader("Content-Type", "application/json")
       .send(body);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Upstream fetch failed", detail: String(err) });
  }
}
