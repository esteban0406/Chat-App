import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe("Root page", () => {
  it("renders a login link pointing to /login", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });
});
