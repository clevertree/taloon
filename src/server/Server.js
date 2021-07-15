import fs from "fs";
import express from "express";
import path from "path";
import {JSDOM} from "jsdom";
import bodyParser from "body-parser";
import FormHandler from "../components/form/FormHandler";


export default class Server {
    constructor() {

        const PATH_BUILD = path.resolve(process.env.REACT_APP_PATH_BUILD);
        const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);
// const BUILD_FILES = path.resolve(BUILD_INDEX, 'files');

        const app = express();
        this.app = app;

        app.use(allowAccessControl);
        app.use( bodyParser.json() );       // to support JSON-encoded bodies
        app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        app.post('*', (req, res, next) => {
            return FormHandler.handleRequest(req, res, next);
        });

        app.use(express.static(PATH_BUILD));
        // app.use(express.static(BUILD_FILES));

        const fileRootHTMLPath = path.resolve(PATH_BUILD, 'index.html');
        app.use((req, res) => {
            switch(req.method.toLowerCase()) {
                case 'options':
                    return res.status(200).send("No Options")

                case 'post':
                    return res.status(400).send("Invalid Post")
            }
            let indexHTML = fs.readFileSync(fileRootHTMLPath, 'utf8');

            const pathIndexMD = path.resolve(PATH_CONTENT + req.path, 'index.md');
            if(fs.existsSync(pathIndexMD)) {
                const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
                indexHTML = updateMetaTagsMD(req, indexHTML, markdownHTML)
                // console.log('Directory index found: ', req.path, pathIndexMD);
            }

            res.send(indexHTML);
        })

    }

    listen(httpPort = process.env.REACT_APP_API_PORT) {
        this.app.listen(httpPort, function() {
            console.log('Taloon Server listening on port: ' + httpPort);
        });
    }
}


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
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}