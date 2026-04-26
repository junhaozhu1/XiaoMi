"use client";

import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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
import { login } from "@/lib/auth-fetch"; // 添加这行

function validateEmail(email) {
  if (!email) return "邮箱不能为空";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  return "";
}

function validatePassword(password) {
  if (!password) return "密码不能为空";
  if (!/^[A-Za-z\d]+$/.test(password)) return "密码包含非法字符（仅允许字母数字）";
  return "";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, type: "success", msg: "" });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      // 使用 auth-fetch 的 login 函数
      const data = await login(email, password);
      
      setSnack({ open: true, type: "success", msg: data.message || "登录成功" });
      
      setTimeout(() => router.push("/app/dashboard"), 600);
    } catch (error) {
      setSnack({ open: true, type: "error", msg: error.message || "登录失败" });
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
        Login
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
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setPasswordErr(validatePassword(password))}
        error={!!passwordErr}
        helperText={passwordErr || " "}
        margin="normal"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                onClick={() => setShowPassword((v) => !v)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 1 }}
      >
        {loading ? "Logging in..." : "Login"}
      </Button>

      <Button fullWidth sx={{ mt: 1 }} onClick={() => router.push("/auth/signup")}>
        去注册
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