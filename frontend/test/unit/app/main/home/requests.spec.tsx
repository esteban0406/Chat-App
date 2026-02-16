import React from "react";
import { render, screen } from "@testing-library/react";
import FriendRequestsPage from "@/app/(main)/home/requests/page";

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

jest.mock("@/ui/home/FriendRequestsList", () => {
  return function MockFriendRequestsList() {
    return <div data-testid="friend-requests-list">FriendRequestsList</div>;
  };
});

describe("FriendRequestsPage", () => {
  it("renders the 'Solicitudes de amistad' heading", () => {
    render(<FriendRequestsPage />);

    expect(
      screen.getByRole("heading", { name: /solicitudes de amistad/i })
    ).toBeInTheDocument();
  });

  it("renders the FriendRequestsList component", () => {
    render(<FriendRequestsPage />);

    expect(screen.getByTestId("friend-requests-list")).toBeInTheDocument();
  });
});
