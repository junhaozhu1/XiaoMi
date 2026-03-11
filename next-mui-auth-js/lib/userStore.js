import { create } from "zustand";

const INITIAL_USERS = [
  { id: 1, name: "Angelique Morse", email: "benny89@yahoo.com", role: "Content Creator", status: "banned" },
  { id: 2, name: "Ariana Lang", email: "avery43@hotmail.com", role: "IT Administrator", status: "pending" },
  { id: 3, name: "Aspen Schmitt", email: "mireya13@hotmail.com", role: "Financial Planner", status: "banned" },
  { id: 4, name: "Brycen Jimenez", email: "tyrel.greenholt@gmail.com", role: "HR Recruiter", status: "active" },
  { id: 5, name: "Chase Day", email: "joana.simonis84@gmail.com", role: "Graphic Designer", status: "banned" },
  { id: 6, name: "Floyd Miles", email: "floyd.miles@outlook.com", role: "Designer", status: "rejected" },
];

function nextId(list) {
  return list.length ? Math.max(...list.map((u) => u.id)) + 1 : 1;
}

export const useUserStore = create((set, get) => ({
  users: INITIAL_USERS,

  createUser: (payload) =>
    set((state) => ({
      users: [{ id: nextId(state.users), ...payload }, ...state.users],
    })),

  updateUser: (id, patch) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),

  bulkDelete: (ids) => {
    const idSet = new Set(ids);
    set((state) => ({
      users: state.users.filter((u) => !idSet.has(u.id)),
    }));
  },

  getUserById: (id) => get().users.find((u) => u.id === id) || null,
}));

export const ROLE_OPTIONS = [
  "Content Creator",
  "IT Administrator",
  "Financial Planner",
  "HR Recruiter",
  "Graphic Designer",
  "Designer",
  "Manager",
  "Admin",
];

export const STATUS_OPTIONS = ["active", "pending", "banned", "rejected"];