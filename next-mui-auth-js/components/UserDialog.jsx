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

export default function UserDialog({
  open,
  mode, // "create" | "edit"
  initialUser,
  onClose,
  onSubmit,
  roleOptions = [],
}) {
  const isEdit = mode === "edit";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("active");

  React.useEffect(() => {
    if (!open) return;
    setName(initialUser?.name ?? "");
    setEmail(initialUser?.email ?? "");
    setRole(initialUser?.role ?? "");
    setStatus(initialUser?.status ?? "active");
  }, [open, initialUser]);

  const canSave = name.trim() && email.trim() && role;

  const handleSave = () => {
    onSubmit({
      ...(isEdit ? { id: initialUser.id } : {}),
      name: name.trim(),
      email: email.trim(),
      role,
      status,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="姓名" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />

          <FormControl>
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