import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

function Explode({ message }: { message: string }): never {
  throw new Error(message);
}

describe('RouteErrorBoundary', () => {
  afterEach(() => cleanup());

  it('renders children when nothing throws', () => {
    render(
      <RouteErrorBoundary label="Dashboard">
        <p>All good</p>
      </RouteErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows the scoped fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RouteErrorBoundary label="Dashboard">
        <Explode message="boom" />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText(/this dashboard page hit a snag/i)).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('uses a generic label when none is provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RouteErrorBoundary>
        <Explode message="bam" />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText(/this page hit a snag/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('recovers when the user taps Try again', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Toggle({ fail }: { fail: boolean }) {
      if (fail) throw new Error('nope');
      return <p>recovered</p>;
    }
    const { rerender } = render(
      <RouteErrorBoundary label="Today's Workout">
        <Toggle fail={true} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText(/this today's workout page hit a snag/i)).toBeInTheDocument();

    rerender(
      <RouteErrorBoundary label="Today's Workout">
        <Toggle fail={false} />
      </RouteErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
    spy.mockRestore();
  });
});
