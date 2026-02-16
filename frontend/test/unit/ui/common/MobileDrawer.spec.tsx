import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileDrawer from '@/ui/common/MobileDrawer';

describe('MobileDrawer', () => {
  it('returns null when open is false', () => {
    const { container } = render(
      <MobileDrawer open={false} onClose={jest.fn()}>
        <p>Drawer content</p>
      </MobileDrawer>,
    );

    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Drawer content')).not.toBeInTheDocument();
  });

  it('renders children when open is true', () => {
    render(
      <MobileDrawer open={true} onClose={jest.fn()}>
        <p>Drawer content</p>
      </MobileDrawer>,
    );

    expect(screen.getByText('Drawer content')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <MobileDrawer open={true} onClose={onClose}>
        <p>Drawer content</p>
      </MobileDrawer>,
    );

    const backdrop = screen.getByRole('button', { name: 'Close drawer' });
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();

    render(
      <MobileDrawer open={true} onClose={onClose}>
        <p>Drawer content</p>
      </MobileDrawer>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not listen for Escape when closed', () => {
    const onClose = jest.fn();

    render(
      <MobileDrawer open={false} onClose={onClose}>
        <p>Drawer content</p>
      </MobileDrawer>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders with left side by default', () => {
    const { container } = render(
      <MobileDrawer open={true} onClose={jest.fn()}>
        <p>Content</p>
      </MobileDrawer>,
    );

    const drawer = container.querySelector('.left-0.top-0.bottom-0');
    expect(drawer).toBeInTheDocument();
  });
});
