import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskList from '../../../components/dashboard/TaskList';
import { TASKS_SAMPLE, TASK_WATER } from '../../fixtures';

beforeEach(() => {
  localStorage.clear();
});

describe('TaskList — empty state', () => {
  it('shows empty message when no tasks', () => {
    render(<TaskList farmId={1} tasks={[]} />);
    expect(screen.getByText(/No tasks yet for this cycle/)).toBeInTheDocument();
  });

  it('still renders the section title when empty', () => {
    render(<TaskList farmId={1} tasks={[]} />);
    expect(screen.getByText('Your tasks today')).toBeInTheDocument();
  });
});

describe('TaskList — with tasks', () => {
  it('renders section title', () => {
    render(<TaskList farmId={1} tasks={TASKS_SAMPLE} />);
    expect(screen.getByText('Your tasks today')).toBeInTheDocument();
  });

  it('renders all task titles', () => {
    render(<TaskList farmId={1} tasks={TASKS_SAMPLE} />);
    expect(screen.getByText('Water your tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Fertilize plants')).toBeInTheDocument();
    expect(screen.getByText('Harvest ripe tomatoes')).toBeInTheDocument();
  });

  it('renders a single task', () => {
    render(<TaskList farmId={1} tasks={[TASK_WATER]} />);
    expect(screen.getByText('Water your tomatoes')).toBeInTheDocument();
  });
});
