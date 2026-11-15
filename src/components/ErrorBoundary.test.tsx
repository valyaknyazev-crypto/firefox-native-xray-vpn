// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws on demand
const ProblemChild = ({ shouldThrow = false, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="child-content">Normal Content</div>;
};

describe('ErrorBoundary Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toBeDefined();
    expect(screen.getByText('Normal Content')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('catches render errors and displays fallback with role="alert" and zero emojis', () => {
    // Suppress console.error from React during intentional throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Critical render failure" />
      </ErrorBoundary>
    );

    const alertBanner = screen.getByRole('alert');
    expect(alertBanner).toBeDefined();
    expect(alertBanner.className).toContain('error-boundary-fallback');
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Critical render failure')).toBeDefined();

    // Verify SVG icon presence (AlertCircleIcon)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);

    // Verify absolute zero emojis in DOM
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.innerHTML)).toBe(false);

    spy.mockRestore();
  });

  it('calls onError callback when error is caught', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ProblemChild shouldThrow={true} message="Tracked error" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe('Tracked error');

    spy.mockRestore();
  });

  it('resets error state when "Try Again" button is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let throwFlag = true;
    const DynamicChild = () => {
      if (throwFlag) {
        throw new Error('Initial crash');
      }
      return <div data-testid="recovered">Recovered successfully</div>;
    };

    render(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Initial crash')).toBeDefined();

    // Fix the error condition and click "Try Again"
    throwFlag = false;
    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainBtn);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('recovered')).toBeDefined();

    spy.mockRestore();
  });

  it('supports custom ReactNode fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error Screen</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeDefined();
    expect(screen.getByText('Custom Error Screen')).toBeDefined();

    spy.mockRestore();
  });

  it('supports custom functional fallback with error and reset handler', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let throwError = true;
    const ChildWrapper = () => <ProblemChild shouldThrow={throwError} message="Specialized error" />;

    render(
      <ErrorBoundary
        fallback={(err, reset) => (
          <div data-testid="fn-fallback">
            <span>Caught: {err.message}</span>
            <button
              onClick={() => {
                throwError = false;
                reset();
              }}
            >
              Reset Component
            </button>
          </div>
        )}
      >
        <ChildWrapper />
      </ErrorBoundary>
    );

    expect(screen.getByText('Caught: Specialized error')).toBeDefined();

    const resetBtn = screen.getByRole('button', { name: 'Reset Component' });
    fireEvent.click(resetBtn);

    expect(screen.getByTestId('child-content')).toBeDefined();

    spy.mockRestore();
  });
});
