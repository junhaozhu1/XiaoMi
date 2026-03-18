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
} from "@mui/material";

import { Doughnut, Line } from "react-chartjs-2";

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
  Filler
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

        const res = await fetch("/companies_100.csv", { cache: "no-store" });
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
          level: String(r.level ?? "").trim(),
          country: String(r.country ?? "").trim(),
          city: String(r.city ?? "").trim(),
          founded_year: String(r.founded_year ?? "").trim(),
          annual_revenue: String(r.annual_revenue ?? "").trim(),
          employees: String(r.employees ?? "").trim(),
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
  const levelDist = React.useMemo(
    () => calcLevelDistribution(companies, ["1", "2", "3"]),
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
              Loading companies_100.csv ...
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

                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      Hover 折线查看每年的累积公司数（可交互）。
                    </Typography>
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