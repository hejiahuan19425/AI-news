import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  // 登录页不需要验证
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {authed && (
        <nav
          className="border-b px-4 py-3 flex items-center gap-6"
          style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}
        >
          <span
            className="font-bold text-sm"
            style={{ color: "var(--brand)", fontFamily: "var(--font-noto-serif-sc), serif" }}
          >
            AI 观察 管理
          </span>
          <Link
            href="/admin/articles"
            className="text-sm transition-colors hover:opacity-70"
            style={{ color: "var(--text)" }}
          >
            文章
          </Link>
          <Link
            href="/admin/sources"
            className="text-sm transition-colors hover:opacity-70"
            style={{ color: "var(--text)" }}
          >
            信源
          </Link>
          <Link
            href="/"
            className="text-sm ml-auto transition-colors hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            ← 返回首页
          </Link>
        </nav>
      )}
      {children}
    </div>
  );
}
