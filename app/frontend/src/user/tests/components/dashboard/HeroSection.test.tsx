import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from '../../../components/dashboard/HeroSection';
import { BUNDLE_TOMATO, BUNDLE_NO_CYCLE } from '../../fixtures';

function renderHero(overrides = {}) {
  const props = {
    bundle: BUNDLE_TOMATO,
    totalGrownKg: 45.75,
    monthsFarming: 9,
    dayOfCycle: 12,
    totalDays: 70,
    progressPct: 17,
    cycleStartLabel: 'Jan 1',
    cycleEndLabel: 'Mar 11',
    ...overrides,
  };
  return render(
    <MemoryRouter>
      <HeroSection {...props} />
    </MemoryRouter>
  );
}

describe('HeroSection', () => {
  it('renders cycle number from bundle', () => {
    renderHero();
    // cycle_number is 3, should appear as "Cycle 3"
    expect(screen.getAllByText(/Cycle 3/i).length).toBeGreaterThan(0);
  });

  it('falls back to Cycle 1 when cycle_number is null', () => {
    renderHero({ bundle: BUNDLE_NO_CYCLE });
    expect(screen.getAllByText(/Cycle 1/i).length).toBeGreaterThan(0);
  });

  it('renders crop name in desktop hero', () => {
    renderHero();
    // Desktop hero tag includes crop name
    expect(screen.getByText(/Tomato/)).toBeInTheDocument();
  });

  it('renders cycle date range labels', () => {
    renderHero();
    expect(screen.getAllByText(/Jan 1.*Mar 11|Jan 1 – Mar 11/).length).toBeGreaterThan(0);
  });

  it('renders total grown kg formatted to 1 decimal', () => {
    renderHero({ totalGrownKg: 45.75 });
    expect(screen.getAllByText('45.8 kg').length).toBeGreaterThan(0);
  });

  it('renders months farming', () => {
    renderHero();
    expect(screen.getAllByText(/9 mo/).length).toBeGreaterThan(0);
  });

  it('renders day of cycle progress', () => {
    renderHero();
    expect(screen.getAllByText(/Day 12 of 70/).length).toBeGreaterThan(0);
  });

  it('renders Member since label when joined_at is present', () => {
    renderHero();
    // joined_at: '2025-06-15T00:00:00' → "Member since Jun 2025"
    expect(screen.getAllByText(/Member since Jun 2025/).length).toBeGreaterThan(0);
  });

  it('does NOT render Member since when joined_at is null', () => {
    renderHero({ bundle: BUNDLE_NO_CYCLE });
    expect(screen.queryByText(/Member since/)).not.toBeInTheDocument();
  });

  it('renders target quantity from bundle', () => {
    renderHero();
    // bundle.quantity_kg = 18.5 — appears in both mobile and desktop hero
    expect(screen.getAllByText(/18\.5 kg/).length).toBeGreaterThan(0);
  });

  it('renders a Log today\'s update button', () => {
    renderHero();
    expect(screen.getByText("Log today's update")).toBeInTheDocument();
  });
});
