import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleMembersSection from "@/ui/servers/modals/roles/RoleMembersSection";
import { mockMember, mockMember2 } from "../../../../../helpers/fixtures";

describe("RoleMembersSection", () => {
  const onAssignMember = jest.fn();
  const onRemoveMember = jest.fn();

  const defaultProps = {
    members: [mockMember, mockMember2],
    allServerMembers: [mockMember, mockMember2],
    ownerId: "owner-id",
    disabled: false,
    onAssignMember,
    onRemoveMember,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the members heading with count", () => {
    render(<RoleMembersSection {...defaultProps} />);

    expect(screen.getByText("Miembros (2)")).toBeInTheDocument();
  });

  it("renders each member username", () => {
    render(<RoleMembersSection {...defaultProps} />);

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("otheruser")).toBeInTheDocument();
  });

  it("shows empty state when there are no members", () => {
    render(<RoleMembersSection {...defaultProps} members={[]} />);

    expect(
      screen.getByText("No hay miembros con este rol."),
    ).toBeInTheDocument();
  });

  it('shows "Quitar" button for non-owner, non-disabled members', () => {
    render(<RoleMembersSection {...defaultProps} />);

    const removeButtons = screen.getAllByText("Quitar");
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show "Quitar" buttons when disabled', () => {
    render(<RoleMembersSection {...defaultProps} disabled={true} />);

    expect(screen.queryByText("Quitar")).not.toBeInTheDocument();
  });

  it('calls onRemoveMember when "Quitar" is clicked', async () => {
    const user = userEvent.setup();
    render(<RoleMembersSection {...defaultProps} />);

    const removeButtons = screen.getAllByText("Quitar");
    await user.click(removeButtons[0]);

    expect(onRemoveMember).toHaveBeenCalledTimes(1);
  });

  it('shows "Agregar miembro" button when not disabled', () => {
    render(<RoleMembersSection {...defaultProps} />);

    expect(screen.getByText("Agregar miembro")).toBeInTheDocument();
  });

  it('hides "Agregar miembro" button when disabled', () => {
    render(<RoleMembersSection {...defaultProps} disabled={true} />);

    expect(screen.queryByText("Agregar miembro")).not.toBeInTheDocument();
  });

  it("opens dropdown and calls onAssignMember when a member is selected", async () => {
    const user = userEvent.setup();

    // Make member2 available for assignment (not already in the role members)
    render(
      <RoleMembersSection
        {...defaultProps}
        members={[mockMember]}
        allServerMembers={[mockMember, mockMember2]}
      />,
    );

    await user.click(screen.getByText("Agregar miembro"));

    // The dropdown should show available members
    expect(screen.getByText("otheruser")).toBeInTheDocument();
    await user.click(screen.getByText("otheruser"));

    expect(onAssignMember).toHaveBeenCalledWith(mockMember2);
  });
});
