import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RolePermissionsSection from "@/ui/servers/modals/roles/RolePermissionsSection";
import type { ServerPermission } from "@/lib/definitions";

describe("RolePermissionsSection", () => {
  const onToggle = jest.fn();

  const defaultProps = {
    permissions: ["CREATE_CHANNEL", "INVITE_MEMBER"] as ServerPermission[],
    disabled: false,
    onToggle,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the section heading", () => {
    render(<RolePermissionsSection {...defaultProps} />);

    expect(screen.getByText("Permisos")).toBeInTheDocument();
  });

  it("renders all permission labels", () => {
    render(<RolePermissionsSection {...defaultProps} />);

    expect(screen.getByText("Crear canal")).toBeInTheDocument();
    expect(screen.getByText("Eliminar canal")).toBeInTheDocument();
    expect(screen.getByText("Eliminar servidor")).toBeInTheDocument();
    expect(screen.getByText("Invitar miembros")).toBeInTheDocument();
    expect(screen.getByText("Eliminar miembros")).toBeInTheDocument();
    expect(screen.getByText("Gestionar roles")).toBeInTheDocument();
  });

  it("renders a switch for each permission", () => {
    render(<RolePermissionsSection {...defaultProps} />);

    // HeadlessUI Switch renders as a button with role="switch"
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(6);
  });

  it("calls onToggle when a switch is clicked", async () => {
    const user = userEvent.setup();
    render(<RolePermissionsSection {...defaultProps} />);

    const switches = screen.getAllByRole("switch");
    // Click the first switch (CREATE_CHANNEL)
    await user.click(switches[0]);

    expect(onToggle).toHaveBeenCalledWith("CREATE_CHANNEL");
  });

  it("calls onToggle with the correct permission for each switch", async () => {
    const user = userEvent.setup();
    render(<RolePermissionsSection {...defaultProps} />);

    const switches = screen.getAllByRole("switch");
    // Click the last switch (MANAGE_ROLES)
    await user.click(switches[5]);

    expect(onToggle).toHaveBeenCalledWith("MANAGE_ROLES");
  });

  it("disables all switches when disabled is true", () => {
    render(<RolePermissionsSection {...defaultProps} disabled={true} />);

    const switches = screen.getAllByRole("switch");
    switches.forEach((sw) => {
      expect(sw).toBeDisabled();
    });
  });
});
