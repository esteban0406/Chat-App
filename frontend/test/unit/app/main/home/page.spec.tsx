import React from "react";
import { render, screen } from "@testing-library/react";
import FriendsPage from "@/app/(main)/home/page";

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

jest.mock("@/ui/home/FriendList", () => {
  return function MockFriendList() {
    return <div data-testid="friend-list">FriendList component</div>;
  };
});

describe("FriendsPage (home page)", () => {
  it("renders the 'Tus amigos' heading", () => {
    render(<FriendsPage />);

    expect(
      screen.getByRole("heading", { name: /tus amigos/i })
    ).toBeInTheDocument();
  });

  it("renders the FriendList component", () => {
    render(<FriendsPage />);

    expect(screen.getByTestId("friend-list")).toBeInTheDocument();
  });
});
