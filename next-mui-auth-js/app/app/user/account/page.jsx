"use client";

import React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useUserStore } from "@/lib/userStore";

export default function Page() {
  const me = useUserStore((s) => s.me);
  const fetchMe = useUserStore((s) => s.fetchMe);
  const updateMe = useUserStore((s) => s.updateMe);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    title: "",
    location: "",
    company: "",
    bio: "",
  });

  React.useEffect(() => {
    (async () => {
      try {
        setErr("");
        const u = me ?? (await fetchMe());
        setForm({
          name: u?.name ?? "",
          title: u?.title ?? "",
          location: u?.location ?? "",
          company: u?.company ?? "",
          bio: u?.bio ?? "",
        });
      } catch (e) {
        setErr(e.message || "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchMe]); // 不依赖 me，避免重复

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const onSave = async () => {
    setSaving(true);
    setErr("");
    setOk("");
    try {
      await updateMe({
        name: form.name.trim(),
        title: form.title.trim(),
        location: form.location.trim(),
        company: form.company.trim(),
        bio: form.bio.trim(),
      });
      setOk("Saved.");
    } catch (e) {
      setErr(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Account
        </Typography>
        <Card sx={{ p: 2 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Account management
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {err ? <Alert severity="error">{err}</Alert> : null}
            {ok ? <Alert severity="success">{ok}</Alert> : null}

            <TextField
              label="Email"
              value={me?.email ?? ""}
              disabled
              helperText="Email is your login account and cannot be changed."
            />

            <TextField label="Name" value={form.name} onChange={onChange("name")} />
            <TextField label="Title" value={form.title} onChange={onChange("title")} />
            <TextField label="Location" value={form.location} onChange={onChange("location")} />
            <TextField label="Company" value={form.company} onChange={onChange("company")} />

            <TextField
              label="Bio"
              value={form.bio}
              onChange={onChange("bio")}
              multiline
              minRows={4}
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={onSave} disabled={saving}>
                Save changes
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}