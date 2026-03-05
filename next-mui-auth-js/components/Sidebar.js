"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
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

const drawerWidth = 220;

const navItems = [
  { label: "Dashboard", href: "/app/dashboard", icon: <DashboardIcon /> },
  { label: "Companies", href: "/app/companies", icon: <BusinessIcon /> },
  { label: "User", href: "/app/user", icon: <PersonIcon /> },
];

export default function Sidebar({ children }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6" noWrap>
            Your App
          </Typography>
        </Toolbar>
        <Divider />

        <List sx={{ py: 1 }}>
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
        </List>
      </Drawer>

      {/* 右侧内容区 */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* 占位，让内容不贴顶（和 Drawer 的 Toolbar 对齐） */}
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}