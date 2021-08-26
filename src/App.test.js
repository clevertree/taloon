import { render, waitFor } from '@testing-library/react';
import App from './App';
import Server from "./server/Server";

test('renders with server', async () => {
  const server = new Server();
  await server.start();
  const results = render(<App />);
  const {container, getByText} = results;
  // getAllByText(/Content/i)

  await waitFor(() => expect(getByText(/Travel/i)).toBeInTheDocument());
  await server.stop();
});
