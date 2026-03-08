import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProgressBar from '../../../components/shared/ProgressBar';

function getFill(container: HTMLElement) {
  return container.querySelector('.pbar-fill') as HTMLElement;
}

describe('ProgressBar', () => {
  it('renders a pbar wrapper', () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.querySelector('.pbar')).toBeInTheDocument();
  });

  it('sets fill width to the value percentage', () => {
    const { container } = render(<ProgressBar value={60} />);
    expect(getFill(container).style.width).toBe('60%');
  });

  it('clamps value above 100 to 100%', () => {
    const { container } = render(<ProgressBar value={150} />);
    expect(getFill(container).style.width).toBe('100%');
  });

  it('clamps negative value to 0%', () => {
    const { container } = render(<ProgressBar value={-10} />);
    expect(getFill(container).style.width).toBe('0%');
  });

  it('renders 0% fill for value=0', () => {
    const { container } = render(<ProgressBar value={0} />);
    expect(getFill(container).style.width).toBe('0%');
  });

  it('renders 100% fill for value=100', () => {
    const { container } = render(<ProgressBar value={100} />);
    expect(getFill(container).style.width).toBe('100%');
  });
});
