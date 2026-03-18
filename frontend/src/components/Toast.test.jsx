import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Helper component that triggers toasts via a button click
function ToastTrigger({ message, type }) {
  const addToast = useToast();
  return (
    <button onClick={() => addToast(message, type)}>
      Show Toast
    </button>
  );
}

function MultiToastTrigger() {
  const addToast = useToast();
  return (
    <button onClick={() => {
      addToast('First', 'success');
      addToast('Second', 'error');
      addToast('Third', 'info');
    }}>
      Show Multiple
    </button>
  );
}

describe('Toast', () => {
  it('renders children without toasts initially', () => {
    render(
      <ToastProvider>
        <div>App Content</div>
      </ToastProvider>
    );
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('shows success toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Operation successful" type="success" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('shows error toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Something went wrong" type="error" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('auto-dismisses after timeout', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Temporary message" type="success" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Temporary message')).toBeInTheDocument();

    // Toast auto-dismisses after 4000ms
    await waitFor(() => {
      expect(screen.queryByText('Temporary message')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('multiple toasts stack', () => {
    render(
      <ToastProvider>
        <MultiToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Multiple'));

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('useToast returns a function', () => {
    let toastFn;
    function Inspector() {
      toastFn = useToast();
      return null;
    }

    render(
      <ToastProvider>
        <Inspector />
      </ToastProvider>
    );

    expect(typeof toastFn).toBe('function');
  });
});
