
// test('renders with server', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/Content/i);
//   expect(linkElement).toBeInTheDocument();
// });

import Server from "../server/Server";
import {MongoClient} from "mongodb";

test('Database test', async () => {
    const server = new Server();
    // await server.listen();
    const dbName = process.env.REACT_APP_DB_NAME + '_db_test';
    const dbURL = process.env.REACT_APP_DB_URL;
    let dbClient = await MongoClient.connect(dbURL);
    await dbClient.db(dbName).dropDatabase();
    await server.connectDB(dbURL, dbName);

    const collections = server.getCollections();
    for(const name in collections) {
        if(collections.hasOwnProperty(name)) {
            const collection = collections[name];
            if(collection['$test'])
                await collection['$test']();
        }
    }
    // await server.stopListening();
    await server.closeDB();

    /** Clean up **/
    await dbClient.db(dbName).dropDatabase();
    await dbClient.close();

});