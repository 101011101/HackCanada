import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toggle from '../../../components/shared/Toggle';

describe('Toggle', () => {
  it('renders a switch button', () => {
    render(<Toggle on={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('sets aria-checked=true when on=true', () => {
    render(<Toggle on={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('sets aria-checked=false when on=false', () => {
    render(<Toggle on={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('adds toggle--on class when on=true', () => {
    render(<Toggle on={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveClass('toggle--on');
  });

  it('does NOT add toggle--on class when on=false', () => {
    render(<Toggle on={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).not.toHaveClass('toggle--on');
  });

  it('calls onChange(!on) when clicked (off→on)', () => {
    const onChange = vi.fn();
    render(<Toggle on={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(!on) when clicked (on→off)', () => {
    const onChange = vi.fn();
    render(<Toggle on={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
