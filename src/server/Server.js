import fs from "fs";
import express from "express";
import path from "path";
import {JSDOM} from "jsdom";
import bodyParser from "body-parser";
import {MongoClient} from "mongodb";

import EmailServer from "./session/SessionServer";
import SessionServer from "./session/SessionServer";
import RequestHandler from "./RequestHandler";
import UserSession from "../user/UserSession";
import UserDB from "../user/UserDB";


export default class Server {
    constructor() {

// const BUILD_FILES = path.resolve(BUILD_INDEX, 'files');

        const app = express();
        this.app = app;
        this.db = null;

        app.use(allowAccessControl);
        // app.use((req, res, next) => {
        //     req.server = this;
        //     next();
        // })

        app.use(express.static(process.env.REACT_APP_PATH_BUILD));
        app.use('/content', express.static(process.env.REACT_APP_PATH_CONTENT, {fallthrough: false}));
        // app.use(express.static(BUILD_FILES));

        app.use( bodyParser.json() );       // to support JSON-encoded bodies
        // app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        //     extended: true
        // }));

        // Setup Sessions
        SessionServer.setupRoutes(app);

        // Setup email server routing
        EmailServer.setupRoutes(app);
        // FormHandler.setupRoutes(app);

        this.setupRoutes(app);



        const fileRootHTMLPath = path.join(process.env.REACT_APP_PATH_BUILD, 'index.html');
        app.use((req, res) => {
            switch(req.method.toLowerCase()) {
                case 'options':
                    return res.status(200).send("No Options")

                case 'post':
                    return res.status(400).send("Invalid Post")
                default:
            }
            // if(req.path.startsWith(`/${process.env.REACT_APP_PATH_CONTENT}`) && req.path.endsWith('.md'))
            //     return res.status(404).send("Markdown page not found")
            let indexHTML = fs.readFileSync(fileRootHTMLPath, 'utf8');

            const pathIndexMD = path.join(process.env.REACT_APP_PATH_CONTENT, req.path, 'index.md');
            if(fs.existsSync(pathIndexMD)) {
                const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
                indexHTML = updateMetaTagsMD(req, indexHTML, markdownHTML)
                // console.log('Directory index found: ', req.path, pathIndexMD);
            }

            res.send(indexHTML);
        })

    }

    setupRoutes(app) {
        walk(process.env.REACT_APP_PATH_CONTENT, (file) => {
            if(file.endsWith('.js')) {
                const routePath = '/' + path.relative(process.env.REACT_APP_PATH_CONTENT, file);
                let handlerConfig = require(path.resolve(file));
                if(handlerConfig.default)
                    handlerConfig = handlerConfig.default;
                let requestCallback = handlerConfig;
                if(typeof handlerConfig !== 'function') {
                    const requestHandler = new RequestHandler(routePath, handlerConfig);
                    // requestCallback = (req, res) => requestHandler.handleRequest(req, res);
                    requestCallback = requestHandler.handleRequest.bind(requestHandler);
                }

                app.all(routePath, (req, res, next) => {
                    const stats = {
                        server: this,
                        userSession: new UserSession(req.session, this.db),
                    }
                    requestCallback(req, res, next, stats);
                });
                console.log("Added Route: ", routePath, requestCallback);
            }
        })
    }

    async listen(httpPort = process.env.REACT_APP_API_PORT) {
        await this.connectDB();
        await new Promise((resolve, reject) => {
            this.app.listen(httpPort, function(err) {
                err ? reject(err) : resolve();
                console.log('Taloon Server listening on port: ' + httpPort);
            });
        })

    }

    async connectDB(url=process.env.REACT_APP_DB_URL) {
        if(!this.db) {
            const client = await new Promise((resolve, reject) => {
                MongoClient.connect(url, function (err, db) {
                    err ? reject(err) : resolve(db);
                    console.log('Database connected: ' + url);
                });
            });
            this.db = client.db(process.env.REACT_APP_DB_NAME);
        }
    }

    getDB() { return this.db; }
    getUserDB() { return new UserDB(this.db); }
}


// db.collection('Employee').insertOne({
//     Employeeid: 4,
//     EmployeeName: "NewEmployee"
// });
// db.close();


function updateMetaTagsMD(req, indexHTML, markdownHTML) {
    const DOM = new JSDOM(indexHTML);
    const document = DOM.window.document;
    const MDDOM = new JSDOM(markdownHTML);
    const documentMD = MDDOM.window.document;

    const metaList = documentMD.querySelectorAll('meta');
    // console.log(metaList);

    for(const metaTag of metaList) {
        let paramName = metaTag.hasAttribute('property') ? 'property' : 'name';
        const key = metaTag.getAttribute(paramName);
        const content = metaTag.content;
        updateMetaTags(document, paramName, key, content);
    }


    return DOM.serialize();

}

function updateMetaTags(document, paramName, key, content) {
    switch(key) {
        case 'title':
            document.title = content;
            break;
        default:
            let elm = document.head.querySelector(`meta[${paramName}="${key}"]`)
            if(!elm) {
                elm = document.createElement('meta');
                elm[paramName] = key;
                document.head.appendChild(elm);
            }
            elm.content = content;
            break;
    }
}
function allowAccessControl(req, res, next) {
    var origin = req.headers.origin || 'http://localhost';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Handler-Type, Form-Path, Form-Position, Form-Preview');
    next();
}

var walk = function(dir, callback) {
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            walk(file, callback);
        } else {
            /* Is a file */
            callback(file);
        }
    });
}