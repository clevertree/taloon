import { render, screen } from '@testing-library/react';
import App from './App';

test('renders with server', () => {
  render(<App />);
  // const linkElement = screen.getByText(/Content/i);
  // expect(linkElement).toBeInTheDocument();
});
