"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

function validateEmail(email) {
  if (!email) return "邮箱不能为空";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  return "";
}

function validatePassword(password) {
  if (!password) return "密码不能为空";
  // 只允许字母数字，至少8位，至少包含字母和数字
  if (!/^[A-Za-z\d]+$/.test(password)) return "密码包含非法字符（仅允许字母数字）";
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password))
    return "密码至少8位，且包含字母和数字";
  return "";
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, type: "success", msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 后端错误：比如邮箱已注册、规则不符合等
        setSnack({ open: true, type: "error", msg: data.message || "注册失败" });
        return;
      }

      setSnack({ open: true, type: "success", msg: data.message || "注册成功" });

      // 注册成功后跳转登录
      setTimeout(() => router.push("/auth/login"), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: 420, p: 3, border: "1px solid #eee", borderRadius: 2 }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sign Up
      </Typography>

      <TextField
        fullWidth
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setEmailErr(validateEmail(email))}
        error={!!emailErr}
        helperText={emailErr || " "}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setPasswordErr(validatePassword(password))}
        error={!!passwordErr}
        helperText={passwordErr || " "}
        margin="normal"
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 1 }}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </Button>

      <Button fullWidth sx={{ mt: 1 }} onClick={() => router.push("/auth/login")}>
        去登录
      </Button>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.type} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}