"use client";

import React from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Box,
  Card,
  Checkbox,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const drawerContentMaxWidth = 1100;
const LEVEL_OPTIONS = ["1", "2", "3", "4"];

function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n ?? "");
  return num.toLocaleString("en-US");
}

function efficiencyColor(value) {
  if (value >= 600) return { bg: "success.light", fg: "success.contrastText" };
  if (value >= 300) return { bg: "warning.light", fg: "warning.contrastText" };
  return { bg: "error.light", fg: "error.contrastText" };
}

function CompanyRow({ row }) {
  const [open, setOpen] = React.useState(false);

  const annual = Number(row.annual_revenue);
  const emp = Number(row.employees);
  const eff = emp ? annual / emp : 0;
  const effFmt = `${formatNumber(annual)} / ${formatNumber(emp)}`;
  const { bg, fg } = efficiencyColor(eff);

  return (
    <>
      <TableRow hover>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen((v) => !v)} aria-label="expand">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 600 }}>{row.company_name}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {row.company_code}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell width={90}>
          <Chip size="small" label={`L${row.level}`} variant="outlined" />
        </TableCell>

        <TableCell width={140}>{row.country}</TableCell>

        <TableCell width={240}>
          <Box
            sx={{
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              bgcolor: bg,
              color: fg,
              fontVariantNumeric: "tabular-nums",
              display: "inline-block",
              minWidth: 210,
              textAlign: "center",
            }}
            title={`Efficiency = annual_revenue / employees = ${eff.toFixed(2)}`}
          >
            {effFmt}
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: "background.default" }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                <Item label="City" value={row.city} />
                <Item label="Founded year" value={row.founded_year} />
                <Item label="Annual revenue" value={formatNumber(row.annual_revenue)} />
                <Item label="Employees" value={formatNumber(row.employees)} />
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function Item({ label, value }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export default function CompaniesPage() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // filters
  const [levels, setLevels] = React.useState([]); // multi
  const [q, setQ] = React.useState("");

  const [page, setPage] = React.useState(0); // 从 0 开始
  const rowsPerPage = 10;

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        // 使用 authFetch 替代 fetch
        const res = await authFetch(`/api/companies?page=1&pageSize=5000`, {
          cache: "no-store",
        });
        
        if (!res.ok) {
          // 如果是 401，可能需要重新登录
          if (res.status === 401) {
            throw new Error("请先登录");
          }
          throw new Error(`Failed to fetch /api/companies: ${res.status}`);
        }
        const payload = await res.json();
        // Nest 分页结构：{ page, pageSize, total, items: [...] }
        const list = Array.isArray(payload) ? payload : payload?.items ?? [];
        const data = list.map((c) => ({
          company_code: String(c.company_code ?? "").trim(),
          company_name: String(c.company_name ?? "").trim(),
          level: String(c.level ?? "").trim(),
          country: String(c.country ?? "").trim(),
          city: String(c.city ?? "").trim(),
          founded_year: c.founded_year ?? "",
          annual_revenue: String(c.annual_revenue ?? "").trim(),
          employees: String(c.employees ?? "").trim(),
        }));
        if (!ignore) setRows(data);
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

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okLevel = levels.length === 0 || levels.includes(String(r.level));
      const okName = !qq || String(r.company_name).toLowerCase().includes(qq);
      return okLevel && okName;
    });
  }, [rows, levels, q]);

  React.useEffect(() => {
    setPage(0);
  }, [q, levels, rows.length]);

  const paged = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  return (
    <Box sx={{ maxWidth: drawerContentMaxWidth, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Companies
        </Typography>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl sx={{ minWidth: 240 }}>
              <InputLabel id="level-label">Level</InputLabel>
              <Select
                labelId="level-label"
                multiple
                value={levels}
                onChange={(e) => setLevels(e.target.value)}
                input={<OutlinedInput label="Level" />}
                renderValue={(selected) => selected.map((x) => `L${x}`).join(", ")}
              >
                {LEVEL_OPTIONS.map((lv) => (
                  <MenuItem key={lv} value={lv}>
                    <Checkbox checked={levels.includes(lv)} />
                    {`Level ${lv}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Search by company name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </Stack>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={48} />
                  <TableCell>名称</TableCell>
                  <TableCell>等级</TableCell>
                  <TableCell>国家</TableCell>
                  <TableCell>盈利效率（annual revenue / employees）</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 6, textAlign: "center", color: "error.main" }}>
                      {error}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && paged.map((r) => (
                  <CompanyRow key={r.company_code} row={r} />
                ))}

                {!loading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
          />
        </Card>
      </Stack>
    </Box>
  );
}