import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#2c2f33] text-white">
      <div className="bg-[#23272a] p-8 rounded-lg w-[350px]">
        {children}
      </div>
    </div>
  );
}
