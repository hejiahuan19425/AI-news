"use client";

import { useState } from "react";

export default function ContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="text-sm px-3 py-1 rounded-full border"
        style={{ color: "var(--muted)", borderColor: "var(--border)" }}
      >
        联系我
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 p-3 rounded-xl shadow-lg flex flex-col items-center gap-2 z-50"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            width: "220px",
          }}
        >
          <img
            src="/wechat-qr.jpg"
            alt="微信二维码"
            style={{ width: "200px", height: "auto", display: "block", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
}
