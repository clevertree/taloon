import Server from "../src/server/Server";
import "../src/action/"

import {config} from "dotenv";
const result = config()
if (result.error) {
    throw result.error
}

const server = new Server()
server.listen();