"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const drawerWidth = 220;

const navItems = [
  { label: "Dashboard", href: "/app/dashboard", icon: <DashboardIcon /> },
  { label: "Companies", href: "/app/companies", icon: <BusinessIcon /> },
];

const userChildren = [
  { label: "Profile", href: "/app/user/profile" },
  { label: "Cards", href: "/app/user/cards" },
  { label: "List", href: "/app/user/list" },
  { label: "Create", href: "/app/user/create" },
];

export default function Sidebar({ children }) {
  const pathname = usePathname();

  const userActive =
    pathname === "/app/user" || pathname?.startsWith("/app/user/");

  const [userOpen, setUserOpen] = React.useState(userActive);

  React.useEffect(() => {
    if (userActive) setUserOpen(true);
  }, [userActive]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6" noWrap>
            App
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

          {/* User 父级 */}
          <ListItemButton selected={userActive} onClick={() => setUserOpen((v) => !v)}>
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
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}