import React from 'react';
import { render, screen } from '@testing-library/react';
import SectionShell from '@/ui/layout/SectionShell';

const mockCloseSectionSidebar = jest.fn();

jest.mock('@/ui/layout/LayoutContext', () => ({
  useLayoutContext: jest.fn(() => ({
    isSectionSidebarOpen: false,
    closeSectionSidebar: mockCloseSectionSidebar,
  })),
}));

import { useLayoutContext } from '@/ui/layout/LayoutContext';

const mockUseLayoutContext = useLayoutContext as jest.MockedFunction<
  typeof useLayoutContext
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLayoutContext.mockReturnValue({
    isSectionSidebarOpen: false,
    closeSectionSidebar: mockCloseSectionSidebar,
    openSectionSidebar: jest.fn(),
    openServerDrawer: jest.fn(),
    closeServerDrawer: jest.fn(),
    openProfileDrawer: jest.fn(),
    closeProfileDrawer: jest.fn(),
    isServerDrawerOpen: false,
    isProfileDrawerOpen: false,
  });
});

describe('SectionShell', () => {
  it('renders children', () => {
    render(
      <SectionShell>
        <p>Main content</p>
      </SectionShell>,
    );

    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders element sidebar', () => {
    render(
      <SectionShell sidebar={<div>Sidebar element</div>}>
        <p>Main content</p>
      </SectionShell>,
    );

    expect(screen.getByText('Sidebar element')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders function sidebar and passes sidebarControls', () => {
    render(
      <SectionShell
        sidebar={({ sidebarControls }) => (
          <div>
            <span>Function sidebar</span>
            <button onClick={sidebarControls.closeSidebar}>Close</button>
          </div>
        )}
      >
        <p>Main content</p>
      </SectionShell>,
    );

    expect(screen.getByText('Function sidebar')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders without sidebar when sidebar prop is undefined', () => {
    const { container } = render(
      <SectionShell>
        <p>Main content</p>
      </SectionShell>,
    );

    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
    // aside should be empty
    expect(aside!.children).toHaveLength(0);
  });

  it('shows mobile overlay when isSectionSidebarOpen is true and sidebar is provided', () => {
    mockUseLayoutContext.mockReturnValue({
      isSectionSidebarOpen: true,
      closeSectionSidebar: mockCloseSectionSidebar,
      openSectionSidebar: jest.fn(),
      openServerDrawer: jest.fn(),
      closeServerDrawer: jest.fn(),
      openProfileDrawer: jest.fn(),
      closeProfileDrawer: jest.fn(),
      isServerDrawerOpen: false,
      isProfileDrawerOpen: false,
    });

    render(
      <SectionShell sidebar={<div>Sidebar content</div>}>
        <p>Main content</p>
      </SectionShell>,
    );

    // The sidebar content should appear twice: desktop aside + mobile overlay
    const sidebarTexts = screen.getAllByText('Sidebar content');
    expect(sidebarTexts.length).toBeGreaterThanOrEqual(2);

    // Mobile overlay close button should exist
    expect(
      screen.getByRole('button', { name: 'Cerrar panel' }),
    ).toBeInTheDocument();
  });

  it('does not show mobile overlay when isSectionSidebarOpen is false', () => {
    render(
      <SectionShell sidebar={<div>Sidebar content</div>}>
        <p>Main content</p>
      </SectionShell>,
    );

    expect(
      screen.queryByRole('button', { name: 'Cerrar panel' }),
    ).not.toBeInTheDocument();
  });
});
