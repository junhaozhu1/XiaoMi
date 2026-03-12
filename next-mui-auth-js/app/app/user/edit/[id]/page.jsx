"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useUserStore, ROLE_OPTIONS, STATUS_OPTIONS } from "@/lib/userStore";

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const getUserById = useUserStore((s) => s.getUserById);
  const updateUser = useUserStore((s) => s.updateUser);

  const user = getUserById(id);

  const [form, setForm] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
  }, [user]);

  if (!user) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">User / Edit</Typography>
        <Box sx={{ color: "text.secondary" }}>
          User not found (id: {String(params.id)})
        </Box>
        <Button variant="outlined" onClick={() => router.push("/app/user/list")}>Back</Button>
      </Stack>
    );
  }

  if (!form) return null;

  const submit = () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      setError("请填写 name / email / role");
      return;
    }

    // dummy 模式下简单校验：email 不与其他用户重复
    const users = useUserStore.getState().users;
    const emailLower = form.email.trim().toLowerCase();
    if (users.some((u) => u.id !== id && u.email.toLowerCase() === emailLower)) {
      setError("该邮箱已被其他用户占用（dummy 校验）");
      return;
    }

    updateUser(id, {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
    });

    router.push("/app/user/list");
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Stack spacing={2}>
        <Typography variant="h4" sx={{ textAlign: "center" }}>User / Edit</Typography>

        <Card sx={{ p: 3}}>
            <Stack spacing={2}>
            <TextField
                label="姓名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
                label="邮箱"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <TextField
                select
                label="Title / Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
                {ROLE_OPTIONS.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
            </TextField>

            <TextField
                select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
                {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
            </TextField>

            {error && <Box sx={{ color: "error.main" }}>{error}</Box>}

            <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={submit}>Save</Button>
                <Button variant="outlined" onClick={() => router.push("/app/user/list")}>Cancel</Button>
            </Stack>
            </Stack>
        </Card>
        </Stack>
    </Box>
  );
}