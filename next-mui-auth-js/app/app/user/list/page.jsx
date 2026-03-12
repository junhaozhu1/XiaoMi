"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  FormControl,
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
} from "@mui/material";

import { useUserStore, ROLE_OPTIONS } from "@/lib/userStore";

const STATUS_COLOR = {
  active: "success",
  pending: "warning",
  banned: "error",
  rejected: "default",
};

export default function UserListPage() {
  const router = useRouter();
  const users = useUserStore((s) => s.users);
  const deleteUser = useUserStore((s) => s.deleteUser);
  const bulkDelete = useUserStore((s) => s.bulkDelete);

  const [q, setQ] = React.useState("");
  const [roles, setRoles] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const okName = !qq || u.name.toLowerCase().includes(qq);
      const okRole = roles.length === 0 || roles.includes(u.role);
      return okName && okRole;
    });
  }, [users, q, roles]);

  const allChecked = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const someChecked = filtered.some((u) => selected.has(u.id)) && !allChecked;

  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) filtered.forEach((u) => next.delete(u.id));
    else filtered.forEach((u) => next.add(u.id));
    setSelected(next);
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const onDeleteOne = (id) => {
    if (!confirm("确认删除该用户？")) return;
    deleteUser(id);
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const onBulkDelete = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`确认删除选中的 ${ids.length} 个用户？`)) return;
    bulkDelete(ids);
    setSelected(new Set());
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4">User / List</Typography>

        <Stack direction="row" spacing={1}>
          <Button color="error" variant="outlined" disabled={!selected.size} onClick={onBulkDelete}>
            多选删除 ({selected.size})
          </Button>
          <Button variant="contained" onClick={() => router.push("/app/user/create")}>
            Add user
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: 260 }}>
            <InputLabel id="role-label">Title / Role</InputLabel>
            <Select
              labelId="role-label"
              multiple
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
              input={<OutlinedInput label="Title / Role" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {ROLE_OPTIONS.map((r) => (
                <MenuItem key={r} value={r}>
                  <Checkbox checked={roles.includes(r)} />
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Search by name"
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
                <TableCell padding="checkbox">
                  <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
                </TableCell>
                <TableCell>姓名</TableCell>
                <TableCell>邮箱</TableCell>
                <TableCell>Title / Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} />
                  </TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Chip size="small" label={u.status} color={STATUS_COLOR[u.status] || "default"} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined" onClick={() => router.push(`/app/user/edit/${u.id}`)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => onDeleteOne(u.id)}>
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}