import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsRow from '../../../components/dashboard/StatsRow';

describe('StatsRow', () => {
  const defaultProps = {
    totalGrownKg: 45.75,
    cyclesComplete: 3,
    thisTargetKg: 18.5,
    dayOfCycle: 12,
    totalDays: 70,
  };

  it('renders total grown kg formatted to 1 decimal', () => {
    render(<StatsRow {...defaultProps} />);
    expect(screen.getByText('45.8 kg')).toBeInTheDocument();
  });

  it('renders cycles complete count', () => {
    render(<StatsRow {...defaultProps} />);
    expect(screen.getByText('Across 3 cycles')).toBeInTheDocument();
  });

  it('renders this cycle target kg', () => {
    render(<StatsRow {...defaultProps} />);
    expect(screen.getByText('18.5 kg')).toBeInTheDocument();
  });

  it('renders day of cycle progress', () => {
    render(<StatsRow {...defaultProps} />);
    expect(screen.getByText(/Day 12 of 70/)).toBeInTheDocument();
  });

  it('formats totalGrownKg with toFixed(1)', () => {
    render(<StatsRow {...defaultProps} totalGrownKg={10} />);
    expect(screen.getByText('10.0 kg')).toBeInTheDocument();
  });
});
