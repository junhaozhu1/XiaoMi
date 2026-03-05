"use client";

import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Companies", href: "/app/companies" },
  { label: "User", href: "/app/user" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = Math.max(
    0,
    TABS.findIndex((t) => pathname === t.href || pathname.startsWith(t.href + "/"))
  );
ba0
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ cursor: "pointer" }} onClick={() => router.push("/app/dashboard")}>
          Next MUI Auth
        </Typography>

        <Box sx={{ flex: 1 }}>
          <Tabs
            value={currentIndex}
            onChange={(_, idx) => router.push(TABS[idx].href)}
            textColor="primary"
            indicatorColor="primary"
          >
            {TABS.map((t) => (
              <Tab key={t.href} label={t.label} />
            ))}
          </Tabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
}