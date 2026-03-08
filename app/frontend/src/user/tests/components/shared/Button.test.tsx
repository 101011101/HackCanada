import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../components/shared/Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it.each([
    ['primary', 'btn--primary'],
    ['secondary', 'btn--secondary'],
    ['accent', 'btn--accent'],
    ['ghost', 'btn--ghost'],
  ] as const)('applies %s variant class', (variant, cls) => {
    render(<Button variant={variant}>Btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn', cls);
  });

  it('applies sm size class', () => {
    render(<Button variant="primary" size="sm">Btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--sm');
  });

  it('applies lg size class', () => {
    render(<Button variant="primary" size="lg">Btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--lg');
  });

  it('does NOT add size class for md (default)', () => {
    render(<Button variant="primary" size="md">Btn</Button>);
    const el = screen.getByRole('button');
    expect(el).not.toHaveClass('btn--md');
  });

  it('adds btn--full when fullWidth=true', () => {
    render(<Button variant="primary" fullWidth>Btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--full');
  });

  it('adds btn--icon when icon=true', () => {
    render(<Button variant="primary" icon>+</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--icon');
  });

  it('is disabled when disabled=true', () => {
    render(<Button variant="primary" disabled>Btn</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does NOT call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button variant="primary" disabled onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type=button', () => {
    render(<Button variant="primary">Btn</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('sets type=submit when specified', () => {
    render(<Button variant="primary" type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
