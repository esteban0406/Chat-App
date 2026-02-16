import { render, screen } from "@testing-library/react";
import RoleDetailPanel from "@/ui/servers/modals/roles/RoleDetailPanel";
import { mockCustomRole, mockMember, mockMember2 } from "../../../../../helpers/fixtures";

jest.mock("@/lib/backend-client", () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn().mockResolvedValue("Error"),
}));

describe("RoleDetailPanel", () => {
  const onSaved = jest.fn();
  const onDeleted = jest.fn();

  const defaultProps = {
    serverId: "server-1",
    role: mockCustomRole,
    isCreating: false,
    allServerMembers: [mockMember, mockMember2],
    ownerId: "owner-id",
    onSaved,
    onDeleted,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows empty state when no role is selected and not creating", () => {
    render(
      <RoleDetailPanel
        {...defaultProps}
        role={null}
        isCreating={false}
      />,
    );

    expect(
      screen.getByText("Selecciona un rol o crea uno nuevo"),
    ).toBeInTheDocument();
  });

  it("renders the role name in the header when a role is selected", () => {
    render(<RoleDetailPanel {...defaultProps} />);

    expect(screen.getByText("Moderador")).toBeInTheDocument();
  });

  it('renders "Nuevo Rol" header when creating', () => {
    render(
      <RoleDetailPanel {...defaultProps} role={null} isCreating={true} />,
    );

    expect(screen.getByText("Nuevo Rol")).toBeInTheDocument();
  });

  it("renders the role settings section", () => {
    render(<RoleDetailPanel {...defaultProps} />);

    expect(screen.getByText("Configuración del rol")).toBeInTheDocument();
  });

  it("renders the permissions section", () => {
    render(<RoleDetailPanel {...defaultProps} />);

    expect(screen.getByText("Permisos")).toBeInTheDocument();
  });

  it("renders the members section for existing roles", () => {
    render(<RoleDetailPanel {...defaultProps} />);

    expect(screen.getByText(/Miembros/)).toBeInTheDocument();
  });

  it("does not render the members section when creating", () => {
    render(
      <RoleDetailPanel {...defaultProps} role={null} isCreating={true} />,
    );

    expect(screen.queryByText(/Miembros/)).not.toBeInTheDocument();
  });

  it('renders "Guardar cambios" button for non-default roles', () => {
    render(<RoleDetailPanel {...defaultProps} />);

    expect(screen.getByText("Guardar cambios")).toBeInTheDocument();
  });

  it('renders "Eliminar" button for non-default roles', () => {
    render(<RoleDetailPanel {...defaultProps} />);

    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });
});
