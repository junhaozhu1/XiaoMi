export function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 大数字单位换算：K / M / B / T
 * 例如：1234 -> 1.23K, 1234567 -> 1.23M
 */
export function formatBigNumber(n) {
  const num = toNumber(n);
  const abs = Math.abs(num);

  const units = [
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];

  for (const u of units) {
    if (abs >= u.v) return `${(num / u.v).toFixed(2)}${u.s}`;
  }
  return `${num.toLocaleString("en-US")}`;
}

export function calcSummary(companies) {
  const companyCount = companies.length;

  const totalRevenue = companies.reduce(
    (sum, c) => sum + toNumber(c.annual_revenue),
    0
  );

  const totalEmployees = companies.reduce(
    (sum, c) => sum + toNumber(c.employees),
    0
  );

  const countries = new Set(
    companies
      .map((c) => String(c.country || "").trim())
      .filter(Boolean)
  );

  return {
    companyCount,
    totalRevenue,
    countryCount: countries.size,
    totalEmployees,
  };
}

export function calcLevelDistribution(companies, levels = ["1", "2", "3"]) {
  const total = companies.length;

  const counts = Object.fromEntries(levels.map((lv) => [lv, 0]));

  for (const c of companies) {
    const lv = String(c.level ?? "").trim();
    if (counts[lv] != null) counts[lv] += 1;
  }

  const items = levels.map((lv) => {
    const count = counts[lv] ?? 0;
    const pct = total > 0 ? (count / total) * 100 : 0;
    return { level: lv, count, pct };
  });

  return { total, items };
}

/**
 * founded_year 累积曲线：
 * 2000 新增 1，2001 新增 3 => 2000=1, 2001=4
 */
export function calcCumulativeByFoundedYear(companies) {
  const years = companies
    .map((c) => toNumber(c.founded_year))
    .filter((y) => y > 0)
    .sort((a, b) => a - b);

  if (years.length === 0) return { labels: [], data: [] };

  const minY = years[0];
  const maxY = years[years.length - 1];

  // 每年新增
  const inc = new Map();
  for (const y of years) inc.set(y, (inc.get(y) || 0) + 1);

  // 累积
  let running = 0;
  const labels = [];
  const data = [];

  for (let y = minY; y <= maxY; y += 1) {
    running += inc.get(y) || 0;
    labels.push(String(y));
    data.push(running);
  }

  return { labels, data };
}