import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  LayoutContextProvider,
  useLayoutContext,
} from "@/ui/layout/LayoutContext";

let mockMatchMediaMatches = false;

beforeEach(() => {
  mockMatchMediaMatches = false;
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: mockMatchMediaMatches,
    media: "",
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
});

function TestConsumer() {
  const ctx = useLayoutContext();
  return (
    <div>
      <span data-testid="server-drawer">{String(ctx.isServerDrawerOpen)}</span>
      <span data-testid="section-sidebar">{String(ctx.isSectionSidebarOpen)}</span>
      <span data-testid="profile-drawer">{String(ctx.isProfileDrawerOpen)}</span>
      <button onClick={ctx.openServerDrawer}>openServer</button>
      <button onClick={ctx.closeServerDrawer}>closeServer</button>
      <button onClick={ctx.openSectionSidebar}>openSection</button>
      <button onClick={ctx.closeSectionSidebar}>closeSection</button>
      <button onClick={ctx.openProfileDrawer}>openProfile</button>
      <button onClick={ctx.closeProfileDrawer}>closeProfile</button>
    </div>
  );
}

function BareConsumer() {
  useLayoutContext();
  return <div />;
}

describe("LayoutContext", () => {
  it("throws error when useLayoutContext is used outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<BareConsumer />)).toThrow(
      "useLayoutContext must be used inside LayoutContextProvider",
    );

    spy.mockRestore();
  });

  it("opens and closes server drawer", () => {
    render(
      <LayoutContextProvider>
        <TestConsumer />
      </LayoutContextProvider>,
    );

    expect(screen.getByTestId("server-drawer").textContent).toBe("false");

    act(() => {
      screen.getByRole("button", { name: "openServer" }).click();
    });
    expect(screen.getByTestId("server-drawer").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "closeServer" }).click();
    });
    expect(screen.getByTestId("server-drawer").textContent).toBe("false");
  });

  it("opens and closes section sidebar", () => {
    render(
      <LayoutContextProvider>
        <TestConsumer />
      </LayoutContextProvider>,
    );

    expect(screen.getByTestId("section-sidebar").textContent).toBe("false");

    act(() => {
      screen.getByRole("button", { name: "openSection" }).click();
    });
    expect(screen.getByTestId("section-sidebar").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "closeSection" }).click();
    });
    expect(screen.getByTestId("section-sidebar").textContent).toBe("false");
  });

  it("opens and closes profile drawer", () => {
    render(
      <LayoutContextProvider>
        <TestConsumer />
      </LayoutContextProvider>,
    );

    expect(screen.getByTestId("profile-drawer").textContent).toBe("false");

    act(() => {
      screen.getByRole("button", { name: "openProfile" }).click();
    });
    expect(screen.getByTestId("profile-drawer").textContent).toBe("true");

    act(() => {
      screen.getByRole("button", { name: "closeProfile" }).click();
    });
    expect(screen.getByTestId("profile-drawer").textContent).toBe("false");
  });

  it("auto-closes all drawers on window resize when width >= 768px", () => {
    render(
      <LayoutContextProvider>
        <TestConsumer />
      </LayoutContextProvider>,
    );

    // Open all drawers
    act(() => {
      screen.getByRole("button", { name: "openServer" }).click();
    });
    act(() => {
      screen.getByRole("button", { name: "openSection" }).click();
    });
    act(() => {
      screen.getByRole("button", { name: "openProfile" }).click();
    });

    expect(screen.getByTestId("server-drawer").textContent).toBe("true");
    expect(screen.getByTestId("section-sidebar").textContent).toBe("true");
    expect(screen.getByTestId("profile-drawer").textContent).toBe("true");

    // Simulate resize to desktop width
    mockMatchMediaMatches = true;
    (window.matchMedia as jest.Mock).mockImplementation(() => ({
      matches: true,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("server-drawer").textContent).toBe("false");
    expect(screen.getByTestId("section-sidebar").textContent).toBe("false");
    expect(screen.getByTestId("profile-drawer").textContent).toBe("false");
  });
});
