"use client";

import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const PASSWORD_RULE_HELPER = "至少8位，必须同时包含字母和数字，只能字母/数字";

function validPassword(pw) {
  if (!pw) return false;
  return /^[A-Za-z\d]+$/.test(pw) && /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);
}

export default function UserDialog({
  open,
  mode, // "create" | "edit"
  initialUser,
  onClose,
  onSubmit,
  roleOptions = [],
  disableRole = false, 
}) {
  const isEdit = mode === "edit";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("active");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    setName(initialUser?.name ?? "");
    setEmail(initialUser?.email ?? "");
    setTitle(initialUser?.title ?? "");
    // 关键：默认 role
    // - edit：用 initialUser.role
    // - create：默认 roleOptions[0]
    const defaultRole = isEdit ? initialUser?.role : roleOptions?.[0];
    setRole(defaultRole ?? "");
    setStatus(initialUser?.status ?? "active");
    setPassword("");
  }, [open, initialUser, isEdit, roleOptions]);

  const canSave =
    name.trim() &&
    (isEdit ? true : email.trim()) &&
    role &&
    (isEdit ? true : validPassword(password));

  const handleSave = () => {
    const base = {
      name: name.trim(),
      title: title.trim(),
      role,
      status,
    };

    if (isEdit) {
      onSubmit({
        id: initialUser.id,
        ...base,
      });
      return;
    }

    onSubmit({
      ...base,
      email: email.trim().toLowerCase(),
      password,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="姓名" value={name} onChange={(e) => setName(e.target.value)} />

          <TextField
            label="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEdit}
            helperText={isEdit ? "编辑模式下不允许修改邮箱" : ""}
          />

          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

          {!isEdit && (
            <TextField
              label="初始密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText={PASSWORD_RULE_HELPER}
              error={password.length > 0 && !validPassword(password)}
            />
          )}

          <FormControl disabled={disableRole}>
            <InputLabel id="edit-role-label">Title / Role</InputLabel>
            <Select
              labelId="edit-role-label"
              label="Title / Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roleOptions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel id="edit-status-label">Status</InputLabel>
            <Select
              labelId="edit-status-label"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="banned">banned</MenuItem>
              <MenuItem value="rejected">rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}