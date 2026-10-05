import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/operations" element={<div>Operations Home Sentinel</div>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('LoginPage — Auth Integration core flow', () => {
  it('shows an error and does not navigate when the password is wrong', async () => {
    const user = userEvent.setup();
    const { container } = renderLoginPage();
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    await user.type(screen.getByPlaceholderText(/operations@panther.rw/i), 'operations@panther.rw');
    await user.type(passwordInput, 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
    expect(screen.queryByText('Operations Home Sentinel')).not.toBeInTheDocument();
  });

  it('logs in and navigates to the role home on correct credentials', async () => {
    const user = userEvent.setup();
    const { container } = renderLoginPage();
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

    await user.type(screen.getByPlaceholderText(/operations@panther.rw/i), 'operations@panther.rw');
    await user.type(passwordInput, 'password@123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Operations Home Sentinel')).toBeInTheDocument());
  });
});
