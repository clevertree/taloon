import fs from "fs";
import express, {request} from "express";
import path from "path";
import {JSDOM} from "jsdom";
import bodyParser from "body-parser";
import {MongoClient} from "mongodb";

import UserSession from "./session/UserSession";

import initiateCollections from "../db/databases";
import SessionServer from "./session/SessionServer";
import EmailServer from "./email/EmailServer";
import MarkdownTemplate from "../components/markdown/MarkdownTemplate";

export default class Server {
    constructor() {

// const BUILD_FILES = path.resolve(BUILD_INDEX, 'files');

        const app = express();
        this.app = app;
        this.db = null;

        app.use(allowAccessControl);
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

        // Access Website Content
        app.use(express.static(process.env.REACT_APP_PATH_CONTENT, {index: 'index.md'}));
        // setHeaders: (res, filePath) => {
        //     const relativeFilePath = path.relative(path.resolve(process.env.REACT_APP_PATH_CONTENT), filePath);
        //     console.log(relativeFilePath);
        //     res.setHeader('Content-Path', relativeFilePath)
        // }}));

        // Access ReactJS / static files
        app.use(express.static(process.env.REACT_APP_PATH_BUILD));



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
            switch(req.headers["content-type"]) {
                case 'text/markdown':
                    console.warn('Markdown page not found: ', req.path);
                    res.setHeader('Content-Type', 'text/markdown');
                    res.send("# Page not found");
                    break;
                default:
                    console.log('Sending index file: ', req.path, req.headers["content-type"]);
                    res.send(indexHTML);
            }
        })

    }

    setupRoutes(app) {
        walk(process.env.REACT_APP_PATH_CONTENT, (file) => {
            if(file.endsWith('.js')) {
                const routePath = '/' + path.relative(process.env.REACT_APP_PATH_CONTENT, file);
                const absPath = path.resolve(file);
                let handlerConfig = require(absPath);
                const handlerCallback = async (req, res, next) => {
                    if(req.method.toLowerCase() === 'options') {
                        next();
                    } else {
                        try {
                            if(process.env.NODE_ENV === 'development')
                                delete require.cache[absPath];
                            let handlerConfig = require(absPath);
                            if(handlerConfig.default)
                                handlerConfig = handlerConfig.default;
                            let requestCallback = handlerConfig;
                            if(typeof requestCallback !== 'function')
                                console.warn(routePath, 'export is not a function', requestCallback)
                            await requestCallback(req, res, this);
                        } catch (e) {
                            console.error(routePath, e);
                            res.status(400).send(`${routePath}: ${e.stack}`);
                        }
                    }
                };

                // if(typeof handlerConfig !== 'function') {
                //     const requestHandler = new RequestHandler(routePath, handlerConfig);
                //     // requestCallback = (req, res) => requestHandler.handleRequest(req, res);
                //     requestCallback = requestHandler.handleRequest.bind(requestHandler);
                // }

                if(routePath.endsWith('index.js')) {
                    const indexPath = routePath.substr(0, routePath.length - 8);
                    app.all(indexPath, handlerCallback);
                    console.log("Added Route: ", indexPath, handlerConfig);
                }
                app.all(routePath, handlerCallback);
                console.log("Added Route: ", routePath, handlerConfig);
            }
        })
    }

    async listen(httpPort = process.env.REACT_APP_API_PORT) {
        await new Promise((resolve, reject) => {
            this.app.listen(httpPort, function(err) {
                err ? reject(err) : resolve();
                console.log('Taloon Server listening on port: ' + httpPort);
            });
        })
        await this.connectDB();
    }

    async connectDB(url=process.env.REACT_APP_DB_URL) {
        if(!this.db) {
            console.log('Connecting to Database: ' + url);
            const client = await MongoClient.connect(url);
            this.db = client.db(process.env.REACT_APP_DB_NAME);
            this.dbms = await initiateCollections(this.db);
        }
    }

    getDB() { return this.db; }
    getCollectionManager(collectionName) { return this.dbms[collectionName]; }
    // getUserContentCollection() { return new ContentCollection(this.db); }
    // getUserDB() { return new UserCollection(this.db); }
    getUserSession(session) { return new UserSession(session, this.db); }
    // getFormHandler(req) { return new FormHandler(req); }
    getContentFile(path, values={}, safeValues={}) { return new MarkdownTemplate(path).generate(values, safeValues); }
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