"use client";

import { useEffect } from "react";

export default function MobileDrawer({
  open,
  onClose,
  side = "left",
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
}) {
  const base =
    "absolute bg-gray-800 shadow-xl transition-transform duration-200 ease-out z-50";

  const sides = {
    left: "left-0 top-0 bottom-0 w-64 max-w-[80%]",
    right: "right-0 top-0 bottom-0 w-64 max-w-[80%]",
    bottom: "left-0 right-0 bottom-0 w-full max-h-[75%] rounded-t-xl",
  };

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <button
        onClick={onClose}
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className={`${base} ${sides[side]}`}>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
