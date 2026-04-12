import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import mysql from "mysql2/promise";
import 'dotenv/config';

const csvPath = process.argv[2] || path.resolve(process.cwd(), "companies_data.csv");

function must(v, name) {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function toNum(v, fallback = 0) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function toEmployees(v) {
  // 清洗像 "18１" 这种混入非数字的情况
  const s = String(v ?? "").trim().replace(/[^\d]/g, "");
  return toNum(s, 0);
}

async function main() {
  const csvText = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (parsed.errors?.length) {
    console.warn("CSV parse errors:", parsed.errors.slice(0, 5));
  }

  const rows = parsed.data.map((r) => ({
    company_code: String(r.company_code ?? "").trim(),
    company_name: String(r.company_name ?? "").trim(),
    level: toNum(r.level),
    country: String(r.country ?? "").trim(),
    city: String(r.city ?? "").trim(),
    founded_year: toNum(r.founded_year),
    annual_revenue: toNum(r.annual_revenue),
    employees: toEmployees(r.employees),
  })).filter(r => r.company_code && r.company_name);

  const pool = await mysql.createPool({
    host: must(process.env.DB_HOST, "DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: must(process.env.DB_USER, "DB_USER"),
    password: must(process.env.DB_PASSWORD, "DB_PASSWORD"),
    database: must(process.env.DB_NAME, "DB_NAME"),
    waitForConnections: true,
    connectionLimit: 5,
  });

  const sql = `
    INSERT INTO companies
      (company_code, company_name, level, country, city, founded_year, annual_revenue, employees)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      company_name=VALUES(company_name),
      level=VALUES(level),
      country=VALUES(country),
      city=VALUES(city),
      founded_year=VALUES(founded_year),
      annual_revenue=VALUES(annual_revenue),
      employees=VALUES(employees)
  `;

  let ok = 0;
  for (const r of rows) {
    await pool.query(sql, [
      r.company_code,
      r.company_name,
      r.level,
      r.country,
      r.city,
      r.founded_year,
      r.annual_revenue,
      r.employees,
    ]);
    ok++;
    if (ok % 200 === 0) console.log(`seeded ${ok}/${rows.length}`);
  }

  await pool.end();
  console.log(`Done. Seeded ${ok} rows into companies.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});