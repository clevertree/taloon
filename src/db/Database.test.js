
// test('renders with server', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/Content/i);
//   expect(linkElement).toBeInTheDocument();
// });

import Server from "../server/Server";

test('Database test', async () => {
    const server = new Server();
    await server.listen();
    await server.connectDB(process.env.REACT_APP_DB_URL, process.env.REACT_APP_DB_NAME);
    const collections = server.getCollections();
    for(const name in collections) {
        if(collections.hasOwnProperty(name)) {
            const collection = collections[name];
            if(collection['$test'])
                await collection['$test']();
        }
    }
    await server.stopListening();
    await server.closeDB();
});