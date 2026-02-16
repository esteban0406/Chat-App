import React from "react";
import { render, screen } from "@testing-library/react";
import ServerRequestsPage from "@/app/(main)/home/server-requests/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

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

jest.mock("@/ui/home/ServerInviteList", () => {
  return function MockServerInviteList() {
    return <div data-testid="server-invite-list">ServerInviteList</div>;
  };
});

describe("ServerRequestsPage", () => {
  it("renders the 'Invitaciones a servidores' heading", () => {
    render(<ServerRequestsPage />);

    expect(
      screen.getByRole("heading", { name: /invitaciones a servidores/i })
    ).toBeInTheDocument();
  });

  it("renders the ServerInviteList component", () => {
    render(<ServerRequestsPage />);

    expect(screen.getByTestId("server-invite-list")).toBeInTheDocument();
  });
});
