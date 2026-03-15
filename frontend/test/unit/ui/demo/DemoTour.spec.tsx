import { render } from "@testing-library/react";
import { act } from "react";
import DemoTour from "@/ui/demo/DemoTour";
import { EVENTS } from "react-joyride";
import { useLayoutContext } from "@/ui/layout/LayoutContext";
import { isDemoMode } from "@/lib/auth";
import { usePathname } from "next/navigation";

let lastJoyrideProps: Record<string, unknown> | null = null;

jest.mock("react-joyride", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    lastJoyrideProps = props;
    return null;
  },
  EVENTS: {
    TOOLTIP: "tooltip",
    STEP_AFTER: "step:after",
  },
  STATUS: {
    FINISHED: "finished",
    SKIPPED: "skipped",
  },
}));

jest.mock("@/ui/layout/LayoutContext", () => ({
  useLayoutContext: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  isDemoMode: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockCloseServerDrawer = jest.fn();
const mockCloseSectionSidebar = jest.fn();
const mockCloseProfileDrawer = jest.fn();

const mockUseLayoutContext = useLayoutContext as jest.MockedFunction<
  typeof useLayoutContext
>;
const mockIsDemoMode = isDemoMode as jest.MockedFunction<typeof isDemoMode>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("DemoTour", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    lastJoyrideProps = null;

    mockIsDemoMode.mockReturnValue(true);
    mockUsePathname.mockReturnValue("/servers/1/channels/2");
    mockUseLayoutContext.mockReturnValue({
      closeServerDrawer: mockCloseServerDrawer,
      closeSectionSidebar: mockCloseSectionSidebar,
      closeProfileDrawer: mockCloseProfileDrawer,
    } as ReturnType<typeof useLayoutContext>);

    mockCloseServerDrawer.mockClear();
    mockCloseSectionSidebar.mockClear();
    mockCloseProfileDrawer.mockClear();

    localStorage.clear();
    localStorage.setItem("demoTourStep", "2");

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("closes all drawers when the mobile phase2 chat-input tooltip appears", () => {
    render(
      <>
        <input data-tour="chat-input" />
        <DemoTour />
      </>
    );

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(lastJoyrideProps).not.toBeNull();
    const callback = lastJoyrideProps?.callback as (data: unknown) => void;

    act(() => {
      callback({
        type: EVENTS.TOOLTIP,
        index: 1,
      });
    });

    expect(mockCloseServerDrawer).toHaveBeenCalledTimes(1);
    expect(mockCloseSectionSidebar).toHaveBeenCalledTimes(1);
    expect(mockCloseProfileDrawer).toHaveBeenCalledTimes(1);
  });
});
