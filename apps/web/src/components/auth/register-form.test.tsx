import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { RegisterForm } from './register-form';

describe('RegisterForm', () => {
  it('shows password mismatch error', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/^Confirm password$/i), {
      target: { value: 'Password2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Passwords must match')).toBeInTheDocument();
  });
});