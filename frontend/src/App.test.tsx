import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { AuthProvider } from './providers/AuthProvider'
import { FlashProvider } from './providers/FlashProvider.tsx'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <FlashProvider>{ui}</FlashProvider>
    </AuthProvider>,
  )
}

test('renders login form', () => {
  renderWithProvider(<App />)

  // Check for the email input
  expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()

  // Check for the password input
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
})

test('accepts input in email and password fields', () => {
  renderWithProvider(<App />)

  const emailInput = screen.getByLabelText(/email/i)
  const passwordInput = screen.getByLabelText(/password/i)

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
  fireEvent.change(passwordInput, { target: { value: 'password123' } })

  expect(emailInput).toHaveValue('test@example.com')
  expect(passwordInput).toHaveValue('password123')
})
