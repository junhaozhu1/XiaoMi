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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 后端错误：用户不存在/密码错误
        setSnack({ open: true, type: "error", msg: data.message || "登录失败" });
        return;
      }

      setSnack({ open: true, type: "success", msg: data.message || "登录成功" });

      setTimeout(() => router.push("/app/dashboard"), 600);
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
// "use client";

// import { useState } from "react";
// import {
//   Alert,
//   Box,
//   Button,
//   Snackbar,
//   TextField,
//   Typography,
// } from "@mui/material";
// import { useRouter } from "next/navigation";

// function validateRequired(value, label) {
//   if (!value || !value.trim()) return `${label} 不能为空`;
//   return "";
// }

// export default function LoginPage() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [emailErr, setEmailErr] = useState("");
//   const [passwordErr, setPasswordErr] = useState("");

//   const [snack, setSnack] = useState({ open: false, type: "success", msg: "" });

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // 只做空值校验
//     const eErr = validateRequired(email, "Email");
//     const pErr = validateRequired(password, "Password");
//     setEmailErr(eErr);
//     setPasswordErr(pErr);

//     if (eErr || pErr) return;

//     // 不用数据库：直接认为登录成功
//     setSnack({ open: true, type: "success", msg: "登录成功（临时：未接数据库）" });

//     setTimeout(() => {
//       router.push("/app/dashboard");
//     }, 500);
//   };

//   return (
//     <Box
//       component="form"
//       onSubmit={handleSubmit}
//       sx={{ width: 420, p: 3, border: "1px solid #eee", borderRadius: 2 }}
//     >
//       <Typography variant="h5" sx={{ mb: 2 }}>
//         Login
//       </Typography>

//       <TextField
//         fullWidth
//         label="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         onBlur={() => setEmailErr(validateRequired(email, "Email"))}
//         error={!!emailErr}
//         helperText={emailErr || " "}
//         margin="normal"
//       />

//       <TextField
//         fullWidth
//         label="Password"
//         type="password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         onBlur={() => setPasswordErr(validateRequired(password, "Password"))}
//         error={!!passwordErr}
//         helperText={passwordErr || " "}
//         margin="normal"
//       />

//       <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>
//         Login
//       </Button>

//       <Button fullWidth sx={{ mt: 1 }} onClick={() => router.push("/auth/signup")}>
//         去注册
//       </Button>

//       <Snackbar
//         open={snack.open}
//         autoHideDuration={2000}
//         onClose={() => setSnack((s) => ({ ...s, open: false }))}
//       >
//         <Alert severity={snack.type} variant="filled">
//           {snack.msg}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// }