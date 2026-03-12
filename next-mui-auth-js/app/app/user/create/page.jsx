"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useUserStore, ROLE_OPTIONS, STATUS_OPTIONS } from "@/lib/userStore";

export default function UserCreatePage() {
  const router = useRouter();
  const createUser = useUserStore((s) => s.createUser);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    role: ROLE_OPTIONS[0],
    status: "active",
  });
  const [error, setError] = React.useState("");

  const submit = () => {
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      setError("请填写 name / email / role");
      return;
    }

    // dummy 模式下简单校验：email 不重复
    const users = useUserStore.getState().users;
    if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setError("该邮箱已存在（dummy 校验）");
      return;
    }

    createUser({
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
        <Typography variant="h4" sx={{ textAlign: "center" }}>User / Create</Typography>

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