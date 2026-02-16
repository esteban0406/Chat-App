import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleSidebar from "@/ui/servers/modals/roles/RoleSidebar";
import { mockRole, mockCustomRole } from "../../../../../helpers/fixtures";

describe("RoleSidebar", () => {
  const onSelectRole = jest.fn();
  const onCreateNew = jest.fn();
  const onClose = jest.fn();

  const defaultProps = {
    serverName: "Mi Servidor",
    roles: [mockRole, mockCustomRole],
    selectedRoleId: null as string | null,
    isCreating: false,
    onSelectRole,
    onCreateNew,
    onClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the server name", () => {
    render(<RoleSidebar {...defaultProps} />);

    expect(screen.getByText("Mi Servidor")).toBeInTheDocument();
  });

  it("renders the Roles heading", () => {
    render(<RoleSidebar {...defaultProps} />);

    expect(screen.getByText("Roles")).toBeInTheDocument();
  });

  it('renders the "Crear rol" button', () => {
    render(<RoleSidebar {...defaultProps} />);

    expect(screen.getByText("Crear rol")).toBeInTheDocument();
  });

  it('calls onCreateNew when "Crear rol" is clicked', async () => {
    const user = userEvent.setup();
    render(<RoleSidebar {...defaultProps} />);

    await user.click(screen.getByText("Crear rol"));
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it("renders each role item", () => {
    render(<RoleSidebar {...defaultProps} />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Moderador")).toBeInTheDocument();
  });

  it("calls onSelectRole when a role item is clicked", async () => {
    const user = userEvent.setup();
    render(<RoleSidebar {...defaultProps} />);

    await user.click(screen.getByText("Moderador"));
    expect(onSelectRole).toHaveBeenCalledWith("role-custom");
  });

  it('renders "Cerrar" button', () => {
    render(<RoleSidebar {...defaultProps} />);

    expect(screen.getByText("Cerrar")).toBeInTheDocument();
  });

  it('calls onClose when "Cerrar" is clicked', async () => {
    const user = userEvent.setup();
    render(<RoleSidebar {...defaultProps} />);

    await user.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
