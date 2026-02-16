import React from "react";
import { render, screen } from "@testing-library/react";
import AddFriendPage from "@/app/(main)/home/add/page";

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

jest.mock("@/ui/home/InviteForm", () => {
  return function MockInviteForm() {
    return (
      <div data-testid="invite-form">
        <h2>Agregar amigos</h2>
      </div>
    );
  };
});

describe("AddFriendPage", () => {
  it("renders the InviteForm component", () => {
    render(<AddFriendPage />);

    expect(screen.getByTestId("invite-form")).toBeInTheDocument();
  });

  it("renders the 'Agregar amigos' heading from InviteForm", () => {
    render(<AddFriendPage />);

    expect(
      screen.getByRole("heading", { name: /agregar amigos/i })
    ).toBeInTheDocument();
  });
});
