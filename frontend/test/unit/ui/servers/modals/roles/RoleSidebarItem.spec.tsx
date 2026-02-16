import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleSidebarItem from "@/ui/servers/modals/roles/RoleSidebarItem";
import { mockCustomRole, mockRole } from "../../../../../helpers/fixtures";

describe("RoleSidebarItem", () => {
  const onSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the role name", () => {
    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={false} onSelect={onSelect} />,
    );

    expect(screen.getByText("Moderador")).toBeInTheDocument();
  });

  it("shows a color dot with the role color", () => {
    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={false} onSelect={onSelect} />,
    );

    const button = screen.getByRole("button");
    const colorDot = button.querySelector("span.rounded-full");
    expect(colorDot).toHaveStyle({ backgroundColor: "#ff5500" });
  });

  it("applies selected state styling", () => {
    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={true} onSelect={onSelect} />,
    );

    const button = screen.getByRole("button");
    expect(button.className).toContain("border-gold");
    expect(button.className).toContain("bg-surface");
  });

  it("applies unselected state styling", () => {
    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={false} onSelect={onSelect} />,
    );

    const button = screen.getByRole("button");
    expect(button.className).toContain("text-text-secondary");
  });

  it('shows "Por defecto" badge for default roles', () => {
    render(
      <RoleSidebarItem role={mockRole} isSelected={false} onSelect={onSelect} />,
    );

    expect(screen.getByText("Por defecto")).toBeInTheDocument();
  });

  it('does not show "Por defecto" badge for custom roles', () => {
    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={false} onSelect={onSelect} />,
    );

    expect(screen.queryByText("Por defecto")).not.toBeInTheDocument();
  });

  it("shows the member count when _count is present", () => {
    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={false} onSelect={onSelect} />,
    );

    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();

    render(
      <RoleSidebarItem role={mockCustomRole} isSelected={false} onSelect={onSelect} />,
    );

    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
