import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleSettingsSection from "@/ui/servers/modals/roles/RoleSettingsSection";

describe("RoleSettingsSection", () => {
  const defaultProps = {
    name: "Moderador",
    color: "#ff5500",
    disabled: false,
    onNameChange: jest.fn(),
    onColorChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the section heading", () => {
    render(<RoleSettingsSection {...defaultProps} />);

    expect(screen.getByText("Configuración del rol")).toBeInTheDocument();
  });

  it("renders the name input with the current value", () => {
    render(<RoleSettingsSection {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText("Moderador");
    expect(nameInput).toHaveValue("Moderador");
  });

  it("renders the color text input with the current value", () => {
    render(<RoleSettingsSection {...defaultProps} />);

    // There are two inputs with the color value: the color picker and the text input
    const textInputs = screen.getAllByDisplayValue("#ff5500");
    expect(textInputs.length).toBeGreaterThanOrEqual(2);
  });

  it("calls onNameChange when the name input changes", async () => {
    const user = userEvent.setup();
    render(<RoleSettingsSection {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText("Moderador");
    await user.clear(nameInput);
    await user.type(nameInput, "A");

    expect(defaultProps.onNameChange).toHaveBeenCalled();
  });

  it("calls onColorChange when the color text input changes", async () => {
    const user = userEvent.setup();
    render(<RoleSettingsSection {...defaultProps} />);

    // Get the text input for color (type="text" with the hex value)
    const colorTextInputs = screen.getAllByDisplayValue("#ff5500");
    const textInput = colorTextInputs.find(
      (el) => el.getAttribute("type") === "text",
    )!;

    await user.clear(textInput);
    await user.type(textInput, "#");

    expect(defaultProps.onColorChange).toHaveBeenCalled();
  });

  it("shows disabled message when disabled is true", () => {
    render(<RoleSettingsSection {...defaultProps} disabled={true} />);

    expect(
      screen.getByText("Los roles por defecto no se pueden modificar."),
    ).toBeInTheDocument();
  });

  it("does not show disabled message when disabled is false", () => {
    render(<RoleSettingsSection {...defaultProps} disabled={false} />);

    expect(
      screen.queryByText("Los roles por defecto no se pueden modificar."),
    ).not.toBeInTheDocument();
  });

  it("disables inputs when disabled is true", () => {
    render(<RoleSettingsSection {...defaultProps} disabled={true} />);

    const nameInput = screen.getByPlaceholderText("Moderador");
    expect(nameInput).toBeDisabled();
  });
});
