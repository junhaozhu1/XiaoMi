"use client";

import { create } from "zustand";

export const ROLE_OPTIONS = ["user", "manager", "admin"]; // 仅用于筛选/UI展示时可用

// =========================
// fetch helper（统一：带 cookie + 兼容非 JSON 错误）
// =========================
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    // 关键：带上 cookie/session，否则 requireMe 可能判“未登录”
    credentials: "include",
    // API 通常不缓存，避免 me/users 取到旧数据
    cache: options.cache ?? "no-store",
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  // 不要直接 res.json()，否则遇到 401/500 返回非 JSON 会崩
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "Invalid response" };
  }

  if (!res.ok) {
    throw new Error(data?.message || `请求失败 (${res.status})`);
  }
  return data;
}

// =========================
// API
// =========================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4100";
export async function apiGetMe() {
  const data = await fetchJson(`${API_BASE}/me`, { method: "GET" });
  return data.user;
}
export async function apiUpdateMe(patch) {
  const data = await fetchJson(`${API_BASE}/me`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.user;
}

export async function apiListUsers() {
  const data = await fetchJson("/api/users", { method: "GET" });
  return data.users;
}

export async function apiCreateUser(payload) {
  const data = await fetchJson("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function apiUpdateUser(id, patch) {
  const data = await fetchJson(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.user;
}

export async function apiDeleteUser(id) {
  await fetchJson(`/api/users/${id}`, { method: "DELETE" });
  return true;
}

// =========================
// Permission helpers (前端隐藏/禁用)
// =========================
export function canViewUserTable(me) {
  // return me?.role === "admin" || me?.role === "manager";
  return !! me
}

export function canCreateUser(me) {
  return me?.role === "admin" || me?.role === "manager";
}

export function canEditRole(me) {
  // 任务规则：只有 admin 可以改 role；manager/user 不可改
  // 但 admin 也不能把别人设为 admin（见 getAssignableRoles）
  return me?.role === "admin";
}

export function getAssignableRoles(me) {
  // admin 不能把别人设为 admin；manager 只能 user；user 不可创建/编辑他人
  if (me?.role === "admin") return ["user", "manager"];
  if (me?.role === "manager") return ["user"];
  return [];
}

export function canManageTarget(me, targetUser) {
  // “能不能对某个用户行进行编辑/删除”
  if (!me || !targetUser) return false;

  // 谁都不能动 admin
  if (targetUser.role === "admin") return false;

  if (me.role === "admin") {
    // admin 可管理 user & manager（但不含 admin）
    return targetUser.role === "user" || targetUser.role === "manager";
  }

  if (me.role === "manager") {
    // manager 只能管理 user
    return targetUser.role === "user";
  }

  return false;
}

// =========================
// Zustand store
// =========================
export const useUserStore = create((set, get) => ({
  me: null,
  users: [],

  loadingMe: false,
  loadingUsers: false,
  errorMe: "",
  errorUsers: "",

  fetchMe: async () => {
    set({ loadingMe: true, errorMe: "" });
    try {
      const me = await apiGetMe();
      set({ me });
      return me;
    } catch (e) {
      set({ errorMe: e.message || "加载当前用户失败" });
      throw e;
    } finally {
      set({ loadingMe: false });
    }
  },

  updateMe: async (patch) => {
    const me = await apiUpdateMe(patch);
    set({ me });
    return me;
  },

  fetchUsers: async () => {
    set({ loadingUsers: true, errorUsers: "" });
    try {
      const users = await apiListUsers();
      set({ users });
      return users;
    } catch (e) {
      set({ errorUsers: e.message || "加载用户失败" });
      throw e;
    } finally {
      set({ loadingUsers: false });
    }
  },

  createUser: async (payload) => {
    const user = await apiCreateUser(payload);
    set({ users: [user, ...get().users] });
    return user;
  },

  updateUser: async (payload) => {
    // payload: {id, ...patch}
    const { id, ...patch } = payload;
    const user = await apiUpdateUser(id, patch);
    set({ users: get().users.map((u) => (u.id === user.id ? user : u)) });
    return user;
  },

  deleteUser: async (id) => {
    await apiDeleteUser(id);
    set({ users: get().users.filter((u) => u.id !== id) });
  },

  bulkDelete: async (ids) => {
    await Promise.all(ids.map((id) => apiDeleteUser(id)));
    set({ users: get().users.filter((u) => !ids.includes(u.id)) });
  },
}));