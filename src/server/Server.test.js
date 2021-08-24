
// test('renders with server', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/Content/i);
//   expect(linkElement).toBeInTheDocument();
// });

import Server from "./Server";
import request from "supertest";
import RouteManager from "./route/RouteManager";

test('Server test', async () => {
    const testPort = parseInt(process.env.REACT_APP_API_PORT);
    const server = new Server();
    const app = server.getExpressApp();
    await server.listen(testPort);
    await server.connectDB();

    const agent = request.agent(app);
    const fileList = RouteManager.getRouteFileList();
    for(const [absPath, routePath] of fileList) {
        let handlerConfig = require(absPath);
        if(handlerConfig['$test'])
            await handlerConfig['$test'](agent, server, routePath);
    }

    /** Test listening **/
    await server.stopListening();

    /** Test Routes **/


});