import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ErrorFallback from '@/components/ErrorFallback';

describe('ErrorFallback', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Firebase configuration guidance', () => {
    const html = renderToStaticMarkup(
      <ErrorFallback
        title="Firebase configuration required"
        message="This app now runs in cloud-only mode. Add your Firebase environment variables and enable Firestore before using it."
        showReload={false}
      />,
    );

    expect(html).toContain('Firebase configuration required');
    expect(html).toContain('cloud-only mode');
    expect(html).toContain('requires a working Firebase configuration');
  });

  it('renders reload action by default for runtime failures', () => {
    const html = renderToStaticMarkup(
      <ErrorFallback
        title="Something went wrong"
        message="The app hit an unexpected error while rendering."
      />,
    );

    expect(html).toContain('Something went wrong');
    expect(html).toContain('Reload app');
  });

  it('invokes window.location.reload when the reload button is clicked', () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, reload },
    });

    render(<ErrorFallback title="Boom" message="Reload please" />);
    fireEvent.click(screen.getByRole('button', { name: /reload app/i }));
    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});
