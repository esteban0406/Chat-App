import { render, screen, waitFor } from "@testing-library/react";
import ManageRolesModal from "@/ui/servers/modals/ManageRolesModal";
import { mockServer, mockRole, mockCustomRole } from "../../../../helpers/fixtures";
import { backendFetch } from "@/lib/backend-client";

jest.mock("@/lib/backend-client", () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn().mockResolvedValue("Error"),
}));

const mockHasPermission = jest.fn().mockReturnValue(true);

jest.mock("@/lib/useServerPermissions", () => ({
  useServerPermissions: () => ({
    hasPermission: mockHasPermission,
    isOwner: true,
    loading: false,
  }),
}));

jest.mock("@/lib/context/CurrentUserContext", () => ({
  useCurrentUser: () => ({
    currentUser: { id: "user-1", username: "testuser", email: "test@example.com" },
    loading: false,
    refreshUser: jest.fn(),
  }),
}));

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;

describe("ManageRolesModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockRole, mockCustomRole]),
    } as unknown as Response);

    mockHasPermission.mockReturnValue(true);
  });

  it("loads roles on mount", async () => {
    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        `/api/servers/${mockServer.id}/roles`,
      );
    });
  });

  it("shows loading state initially", () => {
    // Make the fetch hang
    mockBackendFetch.mockReturnValue(new Promise(() => {}));

    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    expect(screen.getByText("Cargando roles...")).toBeInTheDocument();
  });

  it("renders roles after loading", async () => {
    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    // Admin appears in both sidebar and detail panel header (auto-selected)
    await waitFor(() => {
      expect(screen.getAllByText("Admin").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("Moderador")).toBeInTheDocument();
  });

  it("shows permission denied message when user lacks MANAGE_ROLES", () => {
    mockHasPermission.mockReturnValue(false);

    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    expect(
      screen.getByText("No tienes los permisos requeridos para esta acción."),
    ).toBeInTheDocument();
  });

  it("renders the RoleSidebar with server name", async () => {
    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("Test Server")).toBeInTheDocument();
    });
  });

  it('renders "Crear rol" button', async () => {
    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("Crear rol")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Server error" }),
    } as unknown as Response);

    const { extractErrorMessage } = jest.requireMock("@/lib/backend-client");
    extractErrorMessage.mockResolvedValue("No se pudieron cargar los roles");

    render(<ManageRolesModal server={mockServer} onClose={onClose} />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar los roles"),
      ).toBeInTheDocument();
    });
  });
});
