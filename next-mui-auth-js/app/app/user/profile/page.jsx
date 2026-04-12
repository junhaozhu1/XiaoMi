"use client";

import React from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import { useUserStore } from "@/lib/userStore";

const ASSETS = {
  coverSrc: "/images/profile/cover.jpg",
  avatarSrc: "/images/profile/avatar.jpg",
};

function a11yProps(index) {
  return { id: `profile-tab-${index}`, "aria-controls": `profile-tabpanel-${index}` };
}

function TabPanel({ value, index, children }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      sx={{ pt: 2 }}
    >
      {value === index ? children : null}
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value || "-"}
      </Typography>
    </Stack>
  );
}

export default function UserProfilePage() {
  const [tab, setTab] = React.useState(0);

  const me = useUserStore((s) => s.me);
  const fetchMe = useUserStore((s) => s.fetchMe);

  React.useEffect(() => {
    if (!me) fetchMe();
  }, [me, fetchMe]);

  const [coverOk, setCoverOk] = React.useState(true);
  const [avatarOk, setAvatarOk] = React.useState(true);

  const coverStyle = coverOk
    ? {
        backgroundImage: `url(${ASSETS.coverSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: `radial-gradient(1200px 280px at 20% 20%, rgba(0, 255, 240, 0.22), transparent 55%),
                          radial-gradient(900px 260px at 80% 30%, rgba(255, 0, 180, 0.18), transparent 50%),
                          linear-gradient(135deg, #0b3b46 0%, #0f2c3a 45%, #102235 100%)`,
      };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        User Profile
      </Typography>

      <Card sx={{ overflow: "hidden", borderRadius: 3 }}>
        <Box sx={{ height: 270, position: "relative", ...coverStyle }}>
          <Box
            component="img"
            src={ASSETS.coverSrc}
            alt=""
            onError={() => setCoverOk(false)}
            sx={{ display: "none" }}
          />

          <Box
            sx={{
              position: "absolute",
              left: { xs: 16, md: 24 },
              bottom: -30,
              right: 16,
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <Avatar
              src={avatarOk ? ASSETS.avatarSrc : undefined}
              alt={me?.name || "User"}
              imgProps={{ onError: () => setAvatarOk(false) }}
              sx={{
                width: 120,
                height: 120,
                border: "4px solid",
                borderColor: "background.paper",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              {me?.name?.[0] || "U"}
            </Avatar>

            <Box sx={{ pb: 1 }}>
              <Typography variant="h5" sx={{ color: "common.white", fontWeight: 700 }}>
                {me?.name || "—"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {me?.title || me?.role || ""}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ pt: 6, px: { xs: 1, md: 2 }, bgcolor: "background.paper" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 52,
              "& .MuiTab-root": { minHeight: 52, textTransform: "none" },
            }}
          >
            <Tab icon={<BadgeOutlinedIcon />} iconPosition="start" label="Profile" {...a11yProps(0)} />
            <Tab icon={<FavoriteBorderOutlinedIcon />} iconPosition="start" label="Followers" {...a11yProps(1)} />
            <Tab icon={<GroupOutlinedIcon />} iconPosition="start" label="Friends" {...a11yProps(2)} />
            <Tab icon={<PhotoLibraryOutlinedIcon />} iconPosition="start" label="Gallery" {...a11yProps(3)} />
          </Tabs>
          <Divider />
        </Box>

        <CardContent sx={{ pt: 2 }}>
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                      About
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {me?.bio || "—"}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1}>
                      <InfoRow label="Email" value={me?.email} />
                      <InfoRow label="Location" value={me?.location} />
                      <InfoRow label="Company" value={me?.company} />
                      <InfoRow label="Title" value={me?.title} />
                      <InfoRow label="Role" value={me?.role} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                      Activity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      TODO
                    </Typography>
                  </CardContent>
                </Card>

                <Box sx={{ height: 12 }} />

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                      Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      TODO
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography color="text.secondary">Followers（占位）</Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography color="text.secondary">Friends（占位）</Typography>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Typography color="text.secondary">Gallery（占位）</Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Stack>
  );
}