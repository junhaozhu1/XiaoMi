"use client";

import React from "react";
import Papa from "papaparse";

import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { Doughnut, Line, Bar } from "react-chartjs-2";
import { BarElement } from "chart.js";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

import {
  calcSummary,
  calcLevelDistribution,
  calcCumulativeByFoundedYear,
  formatBigNumber,
} from "@/lib/companyMetrics";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement
);

function MetricCard({ title, value, subtitle }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // =========================
  // 可调参数（你只需要改这里）
  // =========================

  // KPI 四个卡片：控制最小宽度与间距
  const KPI_MIN_CARD_WIDTH = 150; // px
  const KPI_GAP = 3; // MUI spacing单位：5 => 40px

  // 图表两张卡片：控制左右宽度比例与间距、以及何时从两列变一列
  // 例：CHART_COL_WEIGHTS = [5, 7] => 左 5/12 右 7/12（类似你原来的 lg=5/7）
  const CHART_COL_WEIGHTS = [5, 7];
  const CHART_GAP = 2; // 2 => 16px

  // 小于这个宽度时，两张图表卡改为上下排列（1列）
  // 你可以改成 900 / 1000 / 1200 等来“更早或更晚”换行
  const CHART_STACK_BREAKPOINT_PX = 1200;

  // 1) 读取 public/companies_100.csv 全量数据
  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/companies_data.csv", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch csv: ${res.status}`);

        const text = await res.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        if (parsed.errors?.length) {
          console.warn("CSV parse errors:", parsed.errors);
        }

        const data = (parsed.data || []).map((r) => ({
          company_code: String(r.company_code ?? "").trim(),
          company_name: String(r.company_name ?? "").trim(),
          level: Number(String(r.level ?? "").trim()),
          country: String(r.country ?? "").trim(),
          city: String(r.city ?? "").trim(),
          founded_year: Number(String(r.founded_year ?? "").trim()),
          annual_revenue: Number(String(r.annual_revenue ?? "").trim()),
          employees: Number(String(r.employees ?? "").trim().replace(/[^\d]/g, "")),
        }));

        if (!ignore) setCompanies(data);
      } catch (e) {
        if (!ignore) setError(e?.message || "Load failed");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // 2) 动态计算 dashboard 指标
  const summary = React.useMemo(() => calcSummary(companies), [companies]);
  const levelDist = React.useMemo(() =>
    calcLevelDistribution(
      companies.map((c) => ({ ...c, level: String(c.level) })),
      ["1", "2", "3"]
  ),
    [companies]
  );
  const cumulative = React.useMemo(
    () => calcCumulativeByFoundedYear(companies),
    [companies]
  );

  // 3) Doughnut 数据
  const doughnutData = React.useMemo(
    () => ({
      labels: levelDist.items.map((x) => `Level ${x.level}`),
      datasets: [
        {
          label: "Companies",
          data: levelDist.items.map((x) => x.count),
          backgroundColor: ["#e9d00e", "#f7c455", "#c5ad22"],
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    }),
    [levelDist]
  );

  const doughnutOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const count = ctx.parsed;
              const total = levelDist.total || 1;
              const pct = ((count / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${count} (${pct}%)`;
            },
          },
        },
      },
    }),
    [levelDist.total]
  );

  // 4) 折线图数据
  const lineData = React.useMemo(
    () => ({
      labels: cumulative.labels,
      datasets: [
        {
          label: "Cumulative companies",
          data: cumulative.data,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.18)",
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          pointHitRadius: 12,
        },
      ],
    }),
    [cumulative]
  );

  const lineOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} companies`,
          },
        },
      },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
        y: { beginAtZero: true },
      },
    }),
    []
  );

  // ===== Bar chart state =====
  const [barDimension, setBarDimension] = React.useState("country"); // "level" | "country" | "city"
  const [barFilter, setBarFilter] = React.useState({
    level: [], // number[]
    country: [], // string[]
    city: [], // string[]
    founded_year: { start: "", end: "" },
    annual_revenue: { min: "", max: "" },
    employees: { min: "", max: "" },
  });

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  const levelOptions = React.useMemo(
    () => uniq(companies.map((c) => c.level).filter((x) => Number.isFinite(x))).sort((a, b) => a - b),
    [companies]
  );
  const countryOptions = React.useMemo(
    () => uniq(companies.map((c) => c.country).filter(Boolean)).sort(),
    [companies]
  );
  const cityOptions = React.useMemo(
    () => uniq(companies.map((c) => c.city).filter(Boolean)).sort(),
    [companies]
  );

  function toNum(v) {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  function inRange(value, min, max) {
    if (!Number.isFinite(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  }

  const barFilteredCompanies = React.useMemo(() => {
    const fyStart = toNum(barFilter.founded_year.start);
    const fyEnd = toNum(barFilter.founded_year.end);
    const revMin = toNum(barFilter.annual_revenue.min);
    const revMax = toNum(barFilter.annual_revenue.max);
    const empMin = toNum(barFilter.employees.min);
    const empMax = toNum(barFilter.employees.max);

    return companies.filter((c) => {
      if (barFilter.level.length && !barFilter.level.includes(c.level)) return false;
      if (barFilter.country.length && !barFilter.country.includes(c.country)) return false;
      if (barFilter.city.length && !barFilter.city.includes(c.city)) return false;

      if (!inRange(c.founded_year, fyStart, fyEnd)) return false;
      if (!inRange(c.annual_revenue, revMin, revMax)) return false;
      if (!inRange(c.employees, empMin, empMax)) return false;

      return true;
    });
  }, [companies, barFilter]);

  function groupCounts(companiesInput, dimension) {
    const map = new Map();
    for (const c of companiesInput) {
      const key =
        dimension === "level"
          ? `Level ${c.level}`
          : dimension === "country"
            ? c.country
            : c.city;

      map.set(key, (map.get(key) ?? 0) + 1);
    }

    let rows = Array.from(map.entries()).map(([label, count]) => ({ label, count }));

    if (dimension === "level") {
      rows.sort(
        (a, b) =>
          Number(a.label.replace("Level ", "")) - Number(b.label.replace("Level ", ""))
      );
    } else {
      rows.sort((a, b) => b.count - a.count);
    }

    return rows;
  }

  function toTopNWithOthers(rows, n = 20) {
    if (rows.length <= n) return rows;
    const top = rows.slice(0, n);
    const othersCount = rows.slice(n).reduce((sum, r) => sum + r.count, 0);
    return [...top, { label: "Others", count: othersCount }];
  }

  const barGrouped = React.useMemo(() => {
    const rows = groupCounts(barFilteredCompanies, barDimension);

    // Top20 + Others 仅用于 country/city
    if (barDimension === "country" || barDimension === "city") {
      return toTopNWithOthers(rows, 10);
    }
    return rows;
  }, [barFilteredCompanies, barDimension]);

  const barData = React.useMemo(
    () => ({
      labels: barGrouped.map((x) => x.label),
      datasets: [
        {
          label: "Companies",
          data: barGrouped.map((x) => x.count),
          backgroundColor: barGrouped.map((x) => (x.label === "Others" ? "#9ca3af" : "#ff6a00")),
          borderRadius: 6,
          maxBarThickness: 48,
        },
      ],
    }),
    [barGrouped]
  );

  const barOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} companies`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            callback: function (val) {
              // 让长标签不至于太夸张：截断显示
              const label = this.getLabelForValue(val);
              return label.length > 12 ? label.slice(0, 12) + "…" : label;
            },
          },
        },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    }),
    []
  );

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Dashboard
        </Typography>

        {loading ? (
          <Card sx={{ p: 3 }}>
            <Typography sx={{ color: "text.secondary" }}>
              Loading companies_data.csv ...
            </Typography>
          </Card>
        ) : error ? (
          <Card sx={{ p: 3 }}>
            <Typography sx={{ color: "error.main" }}>{error}</Typography>
          </Card>
        ) : (
          <>
            {/* KPI 卡片区（CSS Grid：等宽 + 可调最小宽度） */}
            <Box
              sx={{
                width: "100%",
                display: "grid",
                gap: KPI_GAP,
                gridTemplateColumns: `repeat(auto-fit, minmax(${KPI_MIN_CARD_WIDTH}px, 1fr))`,
                alignItems: "stretch",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <MetricCard
                  title="公司数量"
                  value={formatBigNumber(summary.companyCount)}
                  subtitle={`raw: ${summary.companyCount.toLocaleString("en-US")}`}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <MetricCard
                  title="总收入"
                  value={formatBigNumber(summary.totalRevenue)}
                  subtitle={`raw: ${summary.totalRevenue.toLocaleString("en-US")}`}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <MetricCard
                  title="覆盖国家"
                  value={formatBigNumber(summary.countryCount)}
                  subtitle="unique countries"
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <MetricCard
                  title="员工数量"
                  value={formatBigNumber(summary.totalEmployees)}
                  subtitle={`raw: ${summary.totalEmployees.toLocaleString("en-US")}`}
                />
              </Box>
            </Box>

            {/* 图表区（CSS Grid：左右宽度比例可调 + 可控何时变一列） */}
            <Box
              sx={{
                width: "100%",
                display: "grid",
                gap: CHART_GAP,
                alignItems: "stretch",

                // 默认两列：用权重控制左右宽度比例（类似 5/7、4/8、6/6 等）
                gridTemplateColumns: `minmax(0, ${CHART_COL_WEIGHTS[0]}fr) minmax(0, ${CHART_COL_WEIGHTS[1]}fr)`,

                // 屏幕小于某个阈值时改成一列（上下排列）
                [`@media (max-width:${CHART_STACK_BREAKPOINT_PX}px)`]: {
                  gridTemplateColumns: "1fr",
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Card sx={{ height: "100%", minHeight: 520 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      不同 level 供应公司占比
                    </Typography>

                    <Box sx={{ position: "relative", height: 320, width: "100%" }}>
                      <Doughnut data={doughnutData} options={doughnutOptions} />

                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                          flexDirection: "column",
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Total
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                          {summary.companyCount.toLocaleString("en-US")}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Level</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Percent</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {levelDist.items.map((x) => (
                          <TableRow key={x.level}>
                            <TableCell>{`Level ${x.level}`}</TableCell>
                            <TableCell align="right">{x.count}</TableCell>
                            <TableCell align="right">{x.pct.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            {levelDist.total}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            100.0%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Card sx={{ height: "100%", minHeight: 520 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      founded year 累积加入公司数量
                    </Typography>

                    <Box sx={{ height: 360, width: "100%" }}>
                      <Line data={lineData} options={lineOptions} />
                    </Box>

                    {/* <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      Hover 折线查看每年的累积公司数（可交互）。
                    </Typography> */}
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ minWidth: 0, gridColumn: "1 / -1" }}>
                <Card sx={{ height: "100%", width: "100%", minWidth: 0 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Companies（Top 10 + Others）
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Count by dimension with filters
                          </Typography>
                        </Box>

                        <ToggleButtonGroup
                          size="small"
                          value={barDimension}
                          exclusive
                          onChange={(_, v) => v && setBarDimension(v)}
                        >
                          <ToggleButton value="level">Level</ToggleButton>
                          <ToggleButton value="country">Country</ToggleButton>
                          <ToggleButton value="city">City</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Level</InputLabel>
                          <Select
                            multiple
                            value={barFilter.level}
                            onChange={(e) =>
                              setBarFilter((f) => ({ ...f, level: e.target.value }))
                            }
                            input={<OutlinedInput label="Level" />}
                            renderValue={(selected) => selected.join(", ")}
                          >
                            {levelOptions.map((lv) => (
                              <MenuItem key={lv} value={lv}>
                                <Checkbox checked={barFilter.level.includes(lv)} />
                                <ListItemText primary={lv} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                          <InputLabel>Country</InputLabel>
                          <Select
                            multiple
                            value={barFilter.country}
                            onChange={(e) =>
                              setBarFilter((f) => ({ ...f, country: e.target.value }))
                            }
                            input={<OutlinedInput label="Country" />}
                            renderValue={(selected) => selected.join(", ")}
                          >
                            {countryOptions.map((ct) => (
                              <MenuItem key={ct} value={ct}>
                                <Checkbox checked={barFilter.country.includes(ct)} />
                                <ListItemText primary={ct} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                          <InputLabel>City</InputLabel>
                          <Select
                            multiple
                            value={barFilter.city}
                            onChange={(e) =>
                              setBarFilter((f) => ({ ...f, city: e.target.value }))
                            }
                            input={<OutlinedInput label="City" />}
                            renderValue={(selected) => selected.join(", ")}
                          >
                            {cityOptions.map((city) => (
                              <MenuItem key={city} value={city}>
                                <Checkbox checked={barFilter.city.includes(city)} />
                                <ListItemText primary={city} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField
                          size="small"
                          label="Founded Year Start"
                          type="number"
                          value={barFilter.founded_year.start}
                          onChange={(e) =>
                            setBarFilter((f) => ({
                              ...f,
                              founded_year: { ...f.founded_year, start: e.target.value },
                            }))
                          }
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Founded Year End"
                          type="number"
                          value={barFilter.founded_year.end}
                          onChange={(e) =>
                            setBarFilter((f) => ({
                              ...f,
                              founded_year: { ...f.founded_year, end: e.target.value },
                            }))
                          }
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Revenue Min"
                          type="number"
                          value={barFilter.annual_revenue.min}
                          onChange={(e) =>
                            setBarFilter((f) => ({
                              ...f,
                              annual_revenue: { ...f.annual_revenue, min: e.target.value },
                            }))
                          }
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Revenue Max"
                          type="number"
                          value={barFilter.annual_revenue.max}
                          onChange={(e) =>
                            setBarFilter((f) => ({
                              ...f,
                              annual_revenue: { ...f.annual_revenue, max: e.target.value },
                            }))
                          }
                          fullWidth
                        />
                      </Stack>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField
                          size="small"
                          label="Employees Min"
                          type="number"
                          value={barFilter.employees.min}
                          onChange={(e) =>
                            setBarFilter((f) => ({
                              ...f,
                              employees: { ...f.employees, min: e.target.value },
                            }))
                          }
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Employees Max"
                          type="number"
                          value={barFilter.employees.max}
                          onChange={(e) =>
                            setBarFilter((f) => ({
                              ...f,
                              employees: { ...f.employees, max: e.target.value },
                            }))
                          }
                          fullWidth
                        />
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Showing: {barFilteredCompanies.length} / {companies.length}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider />

                      <Box sx={{ height: 420, width: "100%" }}>
                        <Bar data={barData} options={barOptions} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}