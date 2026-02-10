import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-deep text-white">
      <div className="bg-sidebar border border-border p-8 rounded-lg w-[350px]">
        {children}
      </div>
    </div>
  );
}
