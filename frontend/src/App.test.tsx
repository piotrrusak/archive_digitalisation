import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hello world', () => {
    render(<App />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
});
