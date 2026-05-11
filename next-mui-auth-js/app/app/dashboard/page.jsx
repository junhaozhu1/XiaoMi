"use client";

import React from "react";
import { authFetch } from "@/lib/auth-fetch";
import * as d3 from "d3";

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
import { useTheme } from "@mui/material/styles";

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

/**
 * Build hierarchy based on dimension:
 * - level:   root -> level -> company
 * - country: root -> country -> city -> company
 * - city:    root -> city -> company
 */
function buildBubbleHierarchy(companies, dimension) {
  const root = { name: "Companies", children: [] };

  const getCompanyLeaf = (c) => ({
    name: c.company_name || c.company_code || "Unknown company",
    value: Math.max(1, Number(c.annual_revenue) || 1),
    meta: `level:${c.level} · ${c.country || "-"} / ${c.city || "-"} · employees:${c.employees ?? "-"} · revenue:${c.annual_revenue ?? "-"}`,
    raw: c,
  });

  const ensureChild = (parent, key) => {
    const k = key || "Unknown";
    let node = parent.children.find((x) => x.name === k);
    if (!node) {
      node = { name: k, children: [] };
      parent.children.push(node);
    }
    return node;
  };

  for (const c of companies) {
    const country = c.country || "Unknown country";
    const city = c.city || "Unknown city";
    const level = Number.isFinite(c.level) ? `Level ${c.level}` : "Level ?";

    if (dimension === "level") {
      const levelNode = ensureChild(root, level);
      levelNode.children.push(getCompanyLeaf(c));
    } else if (dimension === "city") {
      const cityNode = ensureChild(root, city);
      cityNode.children.push(getCompanyLeaf(c));
    } else {
      const countryNode = ensureChild(root, country);
      const cityNode = ensureChild(countryNode, city);
      cityNode.children.push(getCompanyLeaf(c));
    }
  }

  const sortTree = (node) => {
    if (!node.children) return;
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortTree);
  };
  sortTree(root);

  return root;
}

/**
 * 气泡交互规则（按要求）：
 * - 不需要高亮或“预选”状态。
 * - 点击后直接进入下一层级。
 * - 不能跳级：只有当前聚焦节点的直接子节点可点击。
 * - 叶子节点（公司）不执行缩放操作。
 * - 点击背景区域会缩放回根节点。
 */
function ZoomableCirclePacking({ data, height = 520 }) {
  const theme = useTheme();
  const containerRef = React.useRef(null);
  const svgRef = React.useRef(null);

  const [size, setSize] = React.useState({ width: 800, height });
  const [tip, setTip] = React.useState({
    open: false,
    x: 0,
    y: 0,
    title: "",
    subtitle: "",
  });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries?.[0]?.contentRect;
      if (!cr) return;
      setSize({ width: Math.max(320, cr.width), height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [height]);

  React.useEffect(() => {
    if (!data || !svgRef.current) return;

    const { width } = size;
    const h = size.height;

    const diameter = Math.min(width, h);
    const margin = 8;
    const inner = diameter - margin * 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `${-diameter / 2} ${-diameter / 2} ${diameter} ${diameter}`)
      .attr("width", "100%")
      .attr("height", h)
      .style("display", "block");

    // ---- 重要：背景捕获矩形（始终可点击）----
    // 把它放在节点分组（nodes group）之前，这样在视觉上位于所有内容的后面，
    // 但仍能接收到那些没有被其他元素阻止事件传播的点击。
    // 我们同时强制让它保持可点击状态。
    const bg = svg
      .append("rect")
      .attr("x", -diameter / 2)
      .attr("y", -diameter / 2)
      .attr("width", diameter)
      .attr("height", diameter)
      .attr("fill", "transparent")
      .style("pointer-events", "all");

    const pack = d3.pack().size([inner, inner]).padding(3);

    const root = d3
      .hierarchy(data)
      .sum((d) => (d.children ? 0 : d.value ?? 1))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    pack(root);

    let focus = root;
    let view;

    const maxDepth = Math.max(2, root.height || 2);
    const color = d3
      .scaleLinear()
      .domain([0, maxDepth])
      .range([theme.palette.primary.light, theme.palette.primary.dark])
      .interpolate(d3.interpolateHcl);

    const g = svg.append("g");

    const nodes = g
      .selectAll("circle.node")
      .data(root.descendants())
      .join("circle")
      .attr("class", "node")
      .attr("fill", (d) => (d.children ? color(d.depth) : theme.palette.warning.main))
      .attr("fill-opacity", (d) => (d.children ? 0.18 : 0.88))
      .attr("stroke", (d) => (d.children ? theme.palette.divider : "transparent"))
      .attr("stroke-width", 1);

    const groupLabel = g
      .append("g")
      .style("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Arial")
      .style("font-size", "18px")              // 更大
      .style("font-weight", 900)               // 更粗
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants().filter((d) => d.children))
      .join("text")
      .style("fill", "#111")                   // 深色字更稳（也可用 theme.palette.text.primary）
      .style("paint-order", "stroke")          // 关键：描边
      .style("stroke", "rgba(255,255,255,0.90)") // 白描边让它压住背景
      .style("stroke-width", 1)                // 描边粗一点更明显
      .style("stroke-linejoin", "round")
      .style("fill-opacity", 0)
      .style("display", "none")
      .style("pointer-events", "none")
      .text((d) => d.data?.name ?? "");

    const leafLabel = g
      .append("g")
      .style("font", "11px system-ui, -apple-system, Segoe UI, Roboto, Arial")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants().filter((d) => !d.children))
      .join("text")
      .style("fill", theme.palette.getContrastText(theme.palette.warning.main))
      .style("paint-order", "stroke")
      .style("stroke", "rgba(0,0,0,0.35)")
      .style("stroke-width", 3)
      .style("display", "none")
      .style("pointer-events", "none")
      .text((d) => d.data?.name ?? "");

    function isCompanyLevelFocus(f) {
      return !!f?.children?.length && f.children.every((c) => !c.children);
    }

    function zoomTo(v) {
      const k = inner / v[2];
      view = v;

      nodes.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      nodes.attr("r", (d) => d.r * k);

      groupLabel.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      leafLabel.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );

      const companyLevel = isCompanyLevelFocus(focus);

      groupLabel
        .style("display", (d) => (d.parent === focus ? "inline" : "none"))
        .style("font-size", (d) => {
            const k = inner / v[2];
            const r = d.r * k;
            return `${Math.max(14, Math.min(26, r / 6))}px`; // 14~26px之间
          })
        .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0));

      leafLabel
        .style("display", (d) => {
          if (!companyLevel) return "none";
          if (d.parent !== focus) return "none";
          const r = d.r * k;
          return r >= 10 ? "inline" : "none";
        })
        .text((d) => {
          const r = d.r * k;
          const name = d.data?.name ?? "";
          const maxChars = Math.max(4, Math.floor(r / 2.8));
          return name.length > maxChars ? name.slice(0, maxChars) + "…" : name;
        });

      nodes.style("cursor", (d) => {
        const canClick = d.parent === focus && !!d.children;
        return canClick ? "pointer" : "default";
      });
    }

    function zoom(event, d) {
      focus = d;

      const transition = svg
        .transition()
        .duration(event?.altKey ? 1200 : 650)
        .ease(d3.easeCubicOut)
        .tween("zoom", () => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return (t) => zoomTo(i(t));
        });

      groupLabel
        .transition(transition)
        .style("fill-opacity", (n) => (n.parent === focus ? 1 : 0))
        .on("start", function (n) {
          if (n.parent === focus) this.style.display = "inline";
        })
        .on("end", function (n) {
          if (n.parent !== focus) this.style.display = "none";
        });
    }

    nodes
      .on("mousemove", (event, d) => {
        const path = d
          .ancestors()
          .reverse()
          .map((x) => x.data?.name)
          .filter(Boolean)
          .join(" / ");

        const extra =
          d.data && !d.children && d.data.meta
            ? ` · ${d.data.meta}`
            : d.value
              ? ` · value:${d.value}`
              : "";

        setTip({
          open: true,
          x: event.clientX,
          y: event.clientY,
          title: d.data?.name ?? "",
          subtitle: `${path}${extra}`,
        });
      })
      .on("mouseleave", () => setTip((t) => ({ ...t, open: false })))
      nodes.on("click", (event, d) => {
        // 只处理“真正点到的那个圆”
        // event.currentTarget === 当前这个 circle
        // event.target 通常也是这个 circle（除非你点到别的元素，但这里主要用来区分）
        // 关键：当你点在“大圈空白处”时，target = focus circle；
        // 当你点在子 bubble 上时，target = 子 bubble circle，不会进这个分支。
        // A) 点到当前 focus 大圈本身（通常意味着点在大圈空白处）
        if (d === focus && event.target === event.currentTarget) {
          if (focus.parent) zoom(event, focus.parent);
          event.stopPropagation();
          return;
        }
        // B) 只允许点击 focus 的“直接子节点”进入下一层（不能跨级）
        const canEnterNext = d.parent === focus && !!d.children;
        if (canEnterNext) {
          zoom(event, d);
          event.stopPropagation();
          return;
        }
        // C) 其它：叶子 or 跨级点击 => 不响应
        event.stopPropagation();
      });

    // Background click: zoom out to ROOT (always works now)
    bg.on("click", (event) => {
      if (focus?.parent) zoom(event, focus.parent);
    });

    zoomTo([root.x, root.y, root.r * 2]);
  }, [data, size.width, size.height, theme]);

  return (
    <Box ref={containerRef} sx={{ width: "100%", minWidth: 0 }}>
      <Box sx={{ position: "relative", height }}>
        <svg ref={svgRef} />
        {tip.open ? (
          <Box
            sx={{
              position: "fixed",
              left: tip.x + 12,
              top: tip.y + 12,
              zIndex: 2000,
              pointerEvents: "none",
              bgcolor: "rgba(17, 24, 39, 0.92)",
              color: "white",
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              maxWidth: 620,
              boxShadow: 6,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {tip.title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {tip.subtitle}
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const KPI_MIN_CARD_WIDTH = 150;
  const KPI_GAP = 3;

  const CHART_COL_WEIGHTS = [5, 7];
  const CHART_GAP = 2;
  const CHART_STACK_BREAKPOINT_PX = 1200;

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        // 使用 authFetch 替代 fetch
        const res = await authFetch("/api/companies?page=1&pageSize=5000", { 
          cache: "no-store" 
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("请先登录");
          }
          throw new Error(`Failed to fetch /api/companies: ${res.status}`);
        }
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? [];
        const data = list.map((c) => ({
          company_code: String(c.company_code ?? "").trim(),
          company_name: String(c.company_name ?? "").trim(),
          level: Number(c.level),
          country: String(c.country ?? "").trim(),
          city: String(c.city ?? "").trim(),
          founded_year: Number(c.founded_year),
          annual_revenue: Number(c.annual_revenue),
          employees: Number(String(c.employees ?? "").trim().replace(/[^\d]/g, "")),
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

  const summary = React.useMemo(() => calcSummary(companies), [companies]);

  const levelDist = React.useMemo(
    () =>
      calcLevelDistribution(
        companies.map((c) => ({ ...c, level: String(c.level) })),
        ["1", "2", "3", "4"]
      ),
    [companies]
  );

  const cumulative = React.useMemo(
    () => calcCumulativeByFoundedYear(companies),
    [companies]
  );

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
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} companies` } },
      },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
        y: { beginAtZero: true },
      },
    }),
    []
  );

  // ===== Shared filter state =====
  const [vizType, setVizType] = React.useState("bar"); // "bar" | "bubble"
  const [barDimension, setBarDimension] = React.useState("country"); // "level" | "country" | "city"
  const [barFilter, setBarFilter] = React.useState({
    level: [],
    country: [],
    city: [],
    founded_year: { start: "", end: "" },
    annual_revenue: { min: "", max: "" },
    employees: { min: "", max: "" },
  });

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  const levelOptions = React.useMemo(
    () =>
      uniq(companies.map((c) => c.level).filter((x) => Number.isFinite(x))).sort(
        (a, b) => a - b
      ),
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

  const filteredCompanies = React.useMemo(() => {
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

  // ===== Bar data =====
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
          Number(a.label.replace("Level ", "")) -
          Number(b.label.replace("Level ", ""))
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
    const rows = groupCounts(filteredCompanies, barDimension);
    if (barDimension === "country" || barDimension === "city") {
      return toTopNWithOthers(rows, 10);
    }
    return rows;
  }, [filteredCompanies, barDimension]);

  const barData = React.useMemo(
    () => ({
      labels: barGrouped.map((x) => x.label),
      datasets: [
        {
          label: "Companies",
          data: barGrouped.map((x) => x.count),
          backgroundColor: barGrouped.map((x) =>
            x.label === "Others" ? "#9ca3af" : "#ff6a00"
          ),
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
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} companies` } },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            callback: function (val) {
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

  // ===== Bubble data (dimension-aware) =====
  const bubbleData = React.useMemo(
    () => buildBubbleHierarchy(filteredCompanies, barDimension),
    [filteredCompanies, barDimension]
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
            {/* KPI */}
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

            {/* Top charts */}
            <Box
              sx={{
                width: "100%",
                display: "grid",
                gap: CHART_GAP,
                alignItems: "stretch",
                gridTemplateColumns: `minmax(0, ${CHART_COL_WEIGHTS[0]}fr) minmax(0, ${CHART_COL_WEIGHTS[1]}fr)`,
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
                  </CardContent>
                </Card>
              </Box>

              {/* Shared filter + switch Bar/Bubble + dimension switch */}
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
                            Companies（with filters）
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Bubble：点击直接进入下一级；只能点击当前层的子节点（不允许跨级）
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <ToggleButtonGroup
                            size="small"
                            value={vizType}
                            exclusive
                            onChange={(_, v) => v && setVizType(v)}
                          >
                            <ToggleButton value="bar">Bar</ToggleButton>
                            <ToggleButton value="bubble">Bubble</ToggleButton>
                          </ToggleButtonGroup>

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
                        </Stack>
                      </Box>

                      {/* Filters */}
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
                            Showing: {filteredCompanies.length} / {companies.length}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider />

                      {vizType === "bar" ? (
                        <Box sx={{ height: 420, width: "100%" }}>
                          <Bar data={barData} options={barOptions} />
                        </Box>
                      ) : (
                        <Box sx={{ width: "100%" }}>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block", mb: 1 }}
                          >
                            Bubble 分级规则：
                            {barDimension === "level"
                              ? " root→level→company"
                              : barDimension === "city"
                                ? " root→city→company"
                                : " root→country→city→company"}
                            {" · "}（点击 bubble 进入下一层；背景点击回到 root）
                          </Typography>
                          <ZoomableCirclePacking data={bubbleData} height={560} />
                        </Box>
                      )}
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