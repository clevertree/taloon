import Server from "../src/server/Server";

import {config} from "dotenv";
const result = config()
if (result.error) {
    throw result.error;
}

const server = new Server();
server.start()
    .catch(err => {
        console.error(err);
        process.exit(1);
    });