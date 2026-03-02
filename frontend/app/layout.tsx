import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discol',
  description: 'Discorl is a Discord clone built with Next.js, Prisma, and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-deep font-sans text-white">
        {children}
      </body>
    </html>
  );
}
