import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ErrorFallback from '@/components/ErrorFallback';

describe('ErrorFallback', () => {
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
});
