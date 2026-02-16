import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "@/app/(auth)/signup/page";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRegister = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue("/signup"),
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
  register: (...args: unknown[]) => mockRegister(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SignUpPage", () => {
  it("renders the signup form with username, email, password and submit button", () => {
    render(<SignUpPage />);

    expect(
      screen.getByRole("heading", { name: /registrarse/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Nombre de usuario")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Correo electrónico")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registrarse/i })
    ).toBeInTheDocument();
  });

  it("calls register with email, password, and username on submit, then navigates to /home", async () => {
    mockRegister.mockResolvedValue({
      user: { id: "1", username: "newuser" },
      accessToken: "tok",
    });

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(
      screen.getByPlaceholderText("Nombre de usuario"),
      "newuser"
    );
    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "new@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "new@example.com",
        "password123",
        "newuser"
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/home");
    });

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error message when register fails", async () => {
    mockRegister.mockRejectedValue(new Error("Email already taken"));

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(
      screen.getByPlaceholderText("Nombre de usuario"),
      "newuser"
    );
    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "dup@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already taken")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error when register throws non-Error", async () => {
    mockRegister.mockRejectedValue("unknown failure");

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(
      screen.getByPlaceholderText("Nombre de usuario"),
      "newuser"
    );
    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "dup@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText("Error al registrarse")).toBeInTheDocument();
    });
  });

  it("has a link to the login page", () => {
    render(<SignUpPage />);

    const loginLink = screen.getByRole("link", { name: /inicia sesión/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows 'Registrando...' while loading", async () => {
    let resolveRegister!: (value: unknown) => void;
    mockRegister.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );

    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(
      screen.getByPlaceholderText("Nombre de usuario"),
      "newuser"
    );
    await user.type(
      screen.getByPlaceholderText("Correo electrónico"),
      "new@example.com"
    );
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /registrarse/i }));

    expect(screen.getByText("Registrando...")).toBeInTheDocument();

    resolveRegister({ user: { id: "1" }, accessToken: "tok" });

    await waitFor(() => {
      expect(screen.queryByText("Registrando...")).not.toBeInTheDocument();
    });
  });
});
