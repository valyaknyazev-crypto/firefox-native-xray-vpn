// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { NoticeBanner } from './NoticeBanner';

describe('NoticeBanner Component', () => {
  it('renders error notice with message and role="alert"', () => {
    const html = renderToString(
      <NoticeBanner type="error" message="Connection to daemon failed" />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('notice-banner-error');
    expect(html).toContain('Connection to daemon failed');
    expect(html).toContain('<svg');
  });

  it('renders warning notice with role="alert"', () => {
    const html = renderToString(
      <NoticeBanner type="warning" message="Please select a server" />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('notice-banner-warning');
    expect(html).toContain('Please select a server');
  });

  it('renders info and success notices with role="status"', () => {
    const infoHtml = renderToString(
      <NoticeBanner type="info" message="Sync complete" />
    );
    expect(infoHtml).toContain('role="status"');
    expect(infoHtml).toContain('notice-banner-info');

    const successHtml = renderToString(
      <NoticeBanner type="success" message="Connected successfully" />
    );
    expect(successHtml).toContain('role="status"');
    expect(successHtml).toContain('notice-banner-success');
  });

  it('renders title when provided', () => {
    const html = renderToString(
      <NoticeBanner
        type="error"
        title="Daemon Offline"
        message="Cannot reach daemon on localhost:18080"
      />
    );

    expect(html).toContain('Daemon Offline');
    expect(html).toContain('notice-title');
  });

  it('renders action button when action has onClick', () => {
    const html = renderToString(
      <NoticeBanner
        type="error"
        message="Daemon missing"
        action={{ label: 'Install Daemon', onClick: () => {} }}
      />
    );

    expect(html).toContain('notice-action-btn');
    expect(html).toContain('Install Daemon');
  });

  it('renders action link when action has href', () => {
    const html = renderToString(
      <NoticeBanner
        type="error"
        message="Daemon missing"
        action={{ label: 'Documentation', href: 'https://github.com' }}
      />
    );

    expect(html).toContain('notice-action-link');
    expect(html).toContain('href="https://github.com"');
    expect(html).toContain('Documentation');
  });

  it('renders dismiss button with vector XIcon when onDismiss is supplied', () => {
    const html = renderToString(
      <NoticeBanner
        type="warning"
        message="Notice text"
        onDismiss={() => {}}
      />
    );

    expect(html).toContain('notice-dismiss-btn');
    expect(html).toContain('aria-label="Dismiss notice"');
    // Vector XIcon
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('d="M18 6 6 18"');
  });

  it('does not render dismiss button when onDismiss is omitted', () => {
    const html = renderToString(
      <NoticeBanner
        type="warning"
        message="Notice text"
      />
    );

    expect(html).not.toContain('notice-dismiss-btn');
  });

  it('triggers onDismiss automatically when autoDismissMs is set', async () => {
    const { render, act } = await import('@testing-library/react');
    const vi = (await import('vitest')).vi;
    vi.useFakeTimers();

    let dismissed = false;
    render(
      <NoticeBanner
        type="info"
        message="Auto dismiss test"
        autoDismissMs={3000}
        onDismiss={() => {
          dismissed = true;
        }}
      />
    );

    expect(dismissed).toBe(false);
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(dismissed).toBe(true);

    vi.useRealTimers();
  });
});
