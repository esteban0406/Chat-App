"use client";

import { useEffect } from "react";

export default function MobileDrawer({ open, children, onClose, side = "left" }) {
  if (!open) return null;

  const sideClasses = {
    left: "left-0 top-0 bottom-0 w-64",
    right: "right-0 top-0 bottom-0 w-64",
    bottom: "left-0 right-0 bottom-0 max-h-[75%] rounded-t-xl",
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`absolute bg-gray-800 shadow-xl ${sideClasses[side]}`}>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
