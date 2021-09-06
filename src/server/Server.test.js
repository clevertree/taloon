
// test('renders with server', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/Content/i);
//   expect(linkElement).toBeInTheDocument();
// });

import Server from "./Server";
import request from "supertest";
import RouteManager from "./route/RouteManager";
import {MongoClient} from "mongodb";

test('Server test', async () => {
    const server = new Server();
    const app = server.getExpressApp();
    // await server.listen();
    const dbName = process.env.REACT_APP_DB_NAME + '_server_test';
    const dbURL = process.env.REACT_APP_DB_URL;
    let dbClient = await MongoClient.connect(dbURL);
    await dbClient.db(dbName).dropDatabase();
    await server.connectDB(dbURL, dbName);

    const agent = request.agent(app);
    const fileList = RouteManager.getRouteFileList();
    for(const [absPath, routePath] of fileList) {
        let handlerConfig = require(absPath);
        if(handlerConfig['$test'])
            await handlerConfig['$test'](agent, server, routePath);
    }

    /** Test listening **/
    // await server.stopListening();
    await server.closeDB();

    /** Test Routes **/

    /** Clean up **/
    await dbClient.db(dbName).dropDatabase();
    await dbClient.close();

});