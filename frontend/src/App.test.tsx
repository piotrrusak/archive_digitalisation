import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders login form', () => {
  render(<App />);

  // Check for the email input
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

  // Check for the password input
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

  // Check for the login button
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('shows validation errors when submitting empty form', () => {
  render(<App />);

  const loginButton = screen.getByRole('button', { name: /login/i });
  fireEvent.click(loginButton);

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
});

test('accepts input in email and password fields', () => {
  render(<App />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });

  expect(emailInput).toHaveValue('test@example.com');
  expect(passwordInput).toHaveValue('password123');
});
