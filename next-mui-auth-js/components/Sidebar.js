"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const drawerWidth = 220;

const navItems = [
  { label: "Dashboard", href: "/app/dashboard", icon: <DashboardIcon /> },
  { label: "Companies", href: "/app/companies", icon: <BusinessIcon /> },
];

const userChildren = [
  { label: "Profile", href: "/app/user/profile" },
  // { label: "Cards", href: "/app/user/cards" },
  { label: "List", href: "/app/user/list" },
  // { label: "Create", href: "/app/user/create" },
];

export default function Sidebar({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const userActive =
    pathname === "/app/user" || pathname?.startsWith("/app/user/");

  const [userOpen, setUserOpen] = React.useState(userActive);

  React.useEffect(() => {
    if (userActive) setUserOpen(true);
  }, [userActive]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("auth");
    } catch {}

    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
          "& .MuiDrawer-paper": {
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Supplier Tracker
          </Typography>
        </Toolbar>

        <Divider />

        {/* 上半部分：导航（占满剩余空间） */}
        <List sx={{ py: 1, flexGrow: 1 }}>
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}

          {/* User 父级 */}
          <ListItemButton
            selected={userActive}
            onClick={() => setUserOpen((v) => !v)}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="User" />
            {userOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>

          <Collapse in={userOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {userChildren.map((c) => (
                <ListItemButton
                  key={c.href}
                  component={Link}
                  href={c.href}
                  selected={pathname === c.href}
                  sx={{ pl: 4 }}
                >
                  <ListItemText primary={c.label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>

        {/* 底部：Logout（填满底部区域） */}
        <Divider />
        <Box sx={{ p: 0 }}>
          <List sx={{ p: 0 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                // 关键：填满底部整块区域
                width: "100%",
                borderRadius: 0,
                py: 2,
                px:12,

                // 浅橙底 + hover 变深
                bgcolor: "rgba(255, 106, 0, 0.20)",
                color: "text.primary",
                "& .MuiListItemIcon-root": {
                  color: "text.primary",
                  minWidth: 40,
                },
                "&:hover": {
                  bgcolor: "rgba(255, 106, 0, 0.35)",
                },
                "&:active": {
                  bgcolor: "rgba(255, 106, 0, 0.45)",
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ sx: { fontWeight: 600 } }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 1.5,

          // 右边距（保持正常）
          pr: { xs: 2, md: 3, lg: 4 },

          // 左边距（更大 -> 内容整体向右）
          pl: { xs: 3, md: 10, lg: 12 },

          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}