"use client";

import React from "react";
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

import UserDialog from "@/components/UserDialog";
import {
  useUserStore,
  ROLE_OPTIONS,
  canViewUserTable,
  canCreateUser,
  canEditRole,
  getAssignableRoles,
  canManageTarget,
} from "@/lib/userStore";

const STATUS_COLOR = {
  active: "success",
  pending: "warning",
  banned: "error",
  rejected: "default",
};

export default function UserListPage() {
  const me = useUserStore((s) => s.me);
  const users = useUserStore((s) => s.users);

  const fetchMe = useUserStore((s) => s.fetchMe);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  const createUser = useUserStore((s) => s.createUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const deleteUser = useUserStore((s) => s.deleteUser);
  const bulkDelete = useUserStore((s) => s.bulkDelete);

  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const current = await fetchMe();
        if (canViewUserTable(current)) {
          await fetchUsers();
        }
      } finally {
        setBooting(false);
      }
    })();
  }, [fetchMe, fetchUsers]);

  // filters
  const [q, setQ] = React.useState(""); // name filter
  const [titleQ, setTitleQ] = React.useState(""); // title filter (new)
  const [roles, setRoles] = React.useState([]); // role filter (multi)
  const [selected, setSelected] = React.useState(new Set());

  // dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState("create");
  const [currentUser, setCurrentUser] = React.useState(null);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    const tt = titleQ.trim().toLowerCase();

    return users.filter((u) => {
      const okName = !qq || (u.name || "").toLowerCase().includes(qq);
      const okTitle = !tt || (u.title || "").toLowerCase().includes(tt);
      const okRole = roles.length === 0 || roles.includes(u.role);
      return okName && okTitle && okRole;
    });
  }, [users, q, titleQ, roles]);

  const canSelectRow = (u) => canManageTarget(me, u); // only deletable rows selectable

  const allChecked =
    filtered.length > 0 &&
    filtered.filter(canSelectRow).length > 0 &&
    filtered.filter(canSelectRow).every((u) => selected.has(u.id));

  const someChecked = filtered.some((u) => selected.has(u.id)) && !allChecked;

  const toggleAll = () => {
    const next = new Set(selected);
    const selectable = filtered.filter(canSelectRow);
    if (allChecked) selectable.forEach((u) => next.delete(u.id));
    else selectable.forEach((u) => next.add(u.id));
    setSelected(next);
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const onDeleteOne = async (u) => {
    if (!canManageTarget(me, u)) return;
    if (!confirm("确认删除该用户？")) return;
    await deleteUser(u.id);
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(u.id);
      return n;
    });
  };

  const onBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`确认删除选中的 ${ids.length} 个用户？`)) return;
    await bulkDelete(ids);
    setSelected(new Set());
  };

  const openCreate = () => {
    if (!canCreateUser(me)) return;
    setDialogMode("create");
    setCurrentUser(null);
    setDialogOpen(true);
  };

  const openEdit = (u) => {
    if (!canManageTarget(me, u)) return;
    setDialogMode("edit");
    setCurrentUser(u);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const handleSubmit = async (payload) => {
    if (dialogMode === "create") {
      await createUser(payload);
    } else {
      await updateUser(payload);
    }
    setDialogOpen(false);
  };

  const visibleRoleFilters = React.useMemo(() => {
    // 筛选可以给全量 ROLE_OPTIONS；这里不做权限收敛（仅筛选），也可保留原样
    if (me?.role === "admin") return ["user", "manager", "admin"];
    if (me?.role === "manager") return ["user", "manager", "admin"];
    return ROLE_OPTIONS;
  }, [me]);

  const dialogRoleOptions = React.useMemo(() => getAssignableRoles(me), [me]);
  const dialogDisableRole = !canEditRole(me);

  if (booting) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          User List
        </Typography>
        <Card sx={{ p: 2 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Card>
      </Stack>
    );
  }

  if (!canViewUserTable(me)) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          User List
        </Typography>
        <Card sx={{ p: 2 }}>
          <Typography color="text.secondary">No permission.</Typography>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          User List
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            color="error"
            variant="outlined"
            disabled={!selected.size}
            onClick={onBulkDelete}
          >
            多选删除 ({selected.size})
          </Button>

          {canCreateUser(me) ? (
            <Button variant="contained" onClick={openCreate}>
              Add user
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Role filter */}
          <FormControl sx={{ width: 240, flexShrink: 0 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              multiple
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
              input={<OutlinedInput label="Role" />}
              renderValue={(sel) => (
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sel.join(", ")}
                </Box>
              )}
            >
              {visibleRoleFilters.map((r) => (
                <MenuItem key={r} value={r}>
                  <Checkbox checked={roles.includes(r)} />
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Title filter */}
          <TextField
            sx={{ width: { xs: "100%", md: 260 }, flexShrink: 0 }}
            label="Search by title"
            value={titleQ}
            onChange={(e) => setTitleQ(e.target.value)}
          />

          {/* Name filter */}
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
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={toggleAll}
                  />
                </TableCell>
                <TableCell>姓名</TableCell>
                <TableCell>邮箱</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((u) => {
                const canRow = canManageTarget(me, u);
                return (
                  <TableRow key={u.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        disabled={!canRow}
                      />
                    </TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.title || "-"}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.status}
                        color={STATUS_COLOR[u.status] || "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {canRow ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEdit(u)}
                          >
                            Edit
                          </Button>
                        ) : null}

                        {canRow ? (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => onDeleteOne(u)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <UserDialog
        open={dialogOpen}
        mode={dialogMode}
        initialUser={currentUser}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        roleOptions={dialogRoleOptions}
        disableRole={dialogDisableRole}
      />
    </Stack>
  );
}