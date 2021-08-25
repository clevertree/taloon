import fs from "fs";
import express from "express";
import path from "path";
import {JSDOM} from "jsdom";
import bodyParser from "body-parser";
import {MongoClient} from "mongodb";

import UserSession from "./session/UserSession";

import {initiateCollections} from "../db/";
import SessionServer from "./session/SessionServer";
import EmailServer from "./email/EmailServer";
import RouteManager from "./route/RouteManager";
import MarkdownTemplate from "../client/markdown/MarkdownTemplate";

export default class Server {
    constructor() {

// const BUILD_FILES = path.resolve(BUILD_INDEX, 'files');
//         this.setupExpress();
    }

    getExpressApp() {
        if(this.app)
            return this.app; // throw new Error("Express is already configured");

        const app = express();
        this.app = app;
        this.appServer = null;
        this.db = null;
        this.dbClient = null;

        app.use(allowAccessControl);

        app.use( bodyParser.json() );       // to support JSON-encoded bodies
        // app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        //     extended: true
        // }));

        // Setup Sessions
        SessionServer.setupRoutes(app);

        // Setup email server routing
        EmailServer.setupRoutes(app);

        RouteManager.setupRoutes(app, this);

        // Access Website Content
        app.use(express.static(process.env.REACT_APP_PATH_CONTENT, {index: 'index.md'}));

        // Access ReactJS / static files
        app.use(express.static(process.env.REACT_APP_PATH_BUILD));



        const fileRootHTMLPath = path.join(process.env.REACT_APP_PATH_BUILD, 'index.html');
        app.use((req, res) => {
            switch(req.method.toLowerCase()) {
                case 'options':
                    return res.status(200).send("No Options")

                case 'post':
                    return res.status(400).send("Invalid Post: " + req.path)
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
            switch(req.headers["content-type"]) {
                case 'text/markdown':
                    console.warn('Markdown page not found: ', req.path);
                    res.setHeader('Content-Type', 'text/markdown');
                    res.send("# Page not found: " + req.path);
                    break;
                default:
                    console.log('Sending index file: ', req.path, req.headers["content-type"]);
                    res.send(indexHTML);
            }
        })

        return this.app;
    }

    async start() {
        await this.connectDB();
        await this.listen();
    }

    async stop() {
        await this.stopListening();
        await this.closeDB();
    }

    async listen(httpPort = process.env.REACT_APP_API_PORT) {
        const app = await this.getExpressApp();
        await new Promise((resolve, reject) => {
            this.appServer = app.listen(httpPort, function(err) {
                err ? reject(err) : resolve();
                console.log('Taloon Server listening on port: ' + httpPort);
            });
        })
    }

    async connectDB(url=process.env.REACT_APP_DB_URL, dbName=process.env.REACT_APP_DB_NAME) {
        if(!this.db) {
            console.log(`Connecting to Database: ${url}/${dbName}`);
            this.dbClient = await MongoClient.connect(url);
            this.db = this.dbClient.db(dbName);
            this.collections = await initiateCollections(this.db);
        }
        return this.db;
    }

    async closeDB() {
        await this.dbClient.close();
    }

    async stopListening() {
        await this.appServer.close();
    }

    getDB() { return this.db; }
    getCollections() { return this.collections; }
    getCollection(collectionName) {
        if(!this.collections[collectionName])
            throw new Error("Collection name not found: " + collectionName);
        return this.collections[collectionName];
    }
    getUserSession(session) { return new UserSession(session, this); }
    // getFormHandler(req) { return new FormHandler(req); }
    async getContentFile(path, values={}, safeValues={}) {
        const template = new MarkdownTemplate(path);
        return await template.generate(values, safeValues);
    }
    getRelativeContentPath(absolutePath) {
        const absContentPath = path.resolve(process.env.REACT_APP_PATH_CONTENT);
        return '/' + path.relative(absContentPath, absolutePath)
    }
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, Form-Preview');
    // res.header('Access-Control-Expose-Headers', 'Content-Path');
    next();
}
