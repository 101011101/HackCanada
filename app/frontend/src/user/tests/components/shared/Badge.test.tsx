import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../../components/shared/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it.each([
    ['success', 'badge--success'],
    ['error', 'badge--error'],
    ['info', 'badge--info'],
    ['accent', 'badge--accent'],
  ] as const)('applies %s variant class', (variant, cls) => {
    render(<Badge variant={variant}>label</Badge>);
    const el = screen.getByText('label');
    expect(el).toHaveClass('badge', cls);
  });

  it('renders as a span element', () => {
    render(<Badge variant="info">Test</Badge>);
    expect(screen.getByText('Test').tagName).toBe('SPAN');
  });
});
