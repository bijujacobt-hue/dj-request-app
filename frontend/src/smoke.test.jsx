import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Frontend test setup', () => {
  it('vitest runs correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('can render a React component', () => {
    render(<div data-testid="hello">Hello</div>);
    expect(screen.getByTestId('hello')).toHaveTextContent('Hello');
  });
});
