import { getPool } from "@/lib/db";
import { requireMe, canManageTarget } from "@/lib/auth";

const ALLOWED_ROLES = new Set(["user", "manager", "admin"]);
const ALLOWED_STATUS = new Set(["active", "disabled"]);

function normalizeString(v, max = 100) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return ""; // 允许空字符串被识别出来（用于校验/拒绝）
  return s.slice(0, max);
}

export async function PATCH(req, { params }) {
  const { me, error } = await requireMe(req);
  if (error) return error;

  // if (me.role !== "admin" && me.role !== "manager") {
  //   return Response.json({ message: "无权限" }, { status: 403 });
  // }

  const id = Number(params.id);
  if (!id) return Response.json({ message: "无效的 id" }, { status: 400 });

  const pool = getPool();

  const [targetRows] = await pool.query(
    "SELECT id, email, name, role, title, status, location, company, bio, created_at FROM users WHERE id = ?",
    [id]
  );
  const target = targetRows[0];
  if (!target) return Response.json({ message: "用户不存在" }, { status: 404 });

  // 由 auth 层规则决定：manager 只能管 user；admin 管 user/manager；且不能管 admin
  if (!canManageTarget(me, target)) {
    return Response.json({ message: "无权限修改该用户" }, { status: 403 });
  }

  const body = await req.json();

  // 不允许改 email
  if (body.email && body.email !== target.email) {
    return Response.json({ message: "不允许修改 email" }, { status: 400 });
  }

  // ---- 处理 role（严格按规则）----
  const nextRoleRaw = normalizeString(body.role, 20); // 可能是 "" / "user" / undefined
  const nextRole = nextRoleRaw === undefined ? undefined : nextRoleRaw; // 只是语义更清晰

  // 传了 role 但为空字符串：直接判无效（避免 body.role || target.role 悄悄回退）
  if (nextRole === "") {
    return Response.json({ message: "无效的 role" }, { status: 400 });
  }

  if (nextRole !== undefined) {
    if (!ALLOWED_ROLES.has(nextRole)) {
      return Response.json({ message: "无效的 role" }, { status: 400 });
    }

    // manager 不允许改 role（即使改成 user 也不允许改动这个字段）
    if (me.role === "manager") {
      return Response.json({ message: "manager 不允许修改角色" }, { status: 403 });
    }

    // admin 不能把任何人设为 admin
    if (me.role === "admin" && nextRole === "admin") {
      return Response.json({ message: "不允许设置为 admin" }, { status: 403 });
    }
  }

  // ---- 处理 status ----
  const nextStatusRaw = normalizeString(body.status, 20);
  const nextStatus = nextStatusRaw === undefined ? undefined : nextStatusRaw;

  if (nextStatus === "") {
    return Response.json({ message: "无效的 status" }, { status: 400 });
  }
  if (nextStatus !== undefined && !ALLOWED_STATUS.has(nextStatus)) {
    return Response.json({ message: "无效的 status" }, { status: 400 });
  }

  // ---- 其他字段 ----
  const patch = {
    name:
      typeof body.name === "string"
        ? body.name.trim().slice(0, 100)
        : target.name,
    title:
      typeof body.title === "string"
        ? body.title.trim().slice(0, 100)
        : target.title,
    location:
      typeof body.location === "string"
        ? body.location.trim().slice(0, 100)
        : target.location,
    company:
      typeof body.company === "string"
        ? body.company.trim().slice(0, 100)
        : target.company,
    bio: typeof body.bio === "string" ? body.bio : target.bio,

    status: nextStatus ?? target.status,
    role: nextRole ?? target.role,
  };

  await pool.query(
    `UPDATE users
     SET name=?, title=?, status=?, role=?, location=?, company=?, bio=?
     WHERE id=?`,
    [patch.name, patch.title, patch.status, patch.role, patch.location, patch.company, patch.bio, id]
  );

  const [rows] = await pool.query(
    "SELECT id, email, name, role, title, status, location, company, bio, created_at FROM users WHERE id = ?",
    [id]
  );

  return Response.json({ user: rows[0] });
}

export async function DELETE(req, { params }) {
  const { me, error } = await requireMe(req);
  if (error) return error;

  if (me.role !== "admin" && me.role !== "manager") {
    return Response.json({ message: "无权限" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ message: "无效的 id" }, { status: 400 });

  if (id === me.id) {
    return Response.json({ message: "不能删除自己" }, { status: 400 });
  }

  const pool = getPool();
  const [targetRows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [id]);
  const target = targetRows[0];
  if (!target) return Response.json({ message: "用户不存在" }, { status: 404 });

  if (!canManageTarget(me, target)) {
    return Response.json({ message: "无权限删除该用户" }, { status: 403 });
  }

  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return Response.json({ message: "删除成功" });
}