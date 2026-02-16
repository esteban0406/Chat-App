import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockLogin = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue("/login"),
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

jest.mock("@/lib/auth", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders the login form with email, password and submit button", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /login/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Correo electrónico")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /login/i })
    ).toBeInTheDocument();
  });

  it("calls login with email and password on submit, then navigates to /home", async () => {
    mockLogin.mockResolvedValue({
      user: { id: "1", username: "test" },
      accessToken: "tok",
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/home");
    });

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error message when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "bad@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error when login throws non-Error", async () => {
    mockLogin.mockRejectedValue("something went wrong");

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "bad@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("has a link to the signup page", () => {
    render(<LoginPage />);

    const signupLink = screen.getByRole("link", { name: /regístrate/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("shows 'Ingresando...' while loading", async () => {
    let resolveLogin!: (value: unknown) => void;
    mockLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText("Ingresando...")).toBeInTheDocument();

    resolveLogin({ user: { id: "1" }, accessToken: "tok" });

    await waitFor(() => {
      expect(screen.queryByText("Ingresando...")).not.toBeInTheDocument();
    });
  });
});
