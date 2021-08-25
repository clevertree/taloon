import path from "path";
import fs from "fs";

export default class RouteManager {
    static setupRoutes(app, server) {
        const fileList = this.getRouteFileList();
        for(const [absPath, routePath] of fileList) {
            let handlerConfig = require(absPath);
            const handlerCallback = async (req, res, next) => {
                if(req.method.toLowerCase() === 'options') {
                    next();
                } else {
                    try {
                        if(process.env.NODE_ENV === 'development')
                            delete require.cache[absPath];
                        let handlerConfig = require(absPath);
                        if(handlerConfig.__esModule === true)
                            handlerConfig = handlerConfig.default;
                        let requestCallback = handlerConfig;
                        if(typeof requestCallback !== 'function')
                            console.warn(routePath, 'export is not a function', requestCallback)
                        await requestCallback(req, res, server, routePath);
                    } catch (e) {
                        console.error(routePath, e);
                        res.status(400).send(`${routePath}: ${e.stack}`);
                    }
                }
            };

            if(routePath.endsWith('index.js')) {
                const indexPath = routePath.substr(0, routePath.length - 8);
                app.all(indexPath, handlerCallback);
                console.log("Added Route: ", indexPath, handlerConfig);
            }
            app.all(routePath, handlerCallback);
            console.log("Added Route: ", routePath, handlerConfig);
        }
    }

    static getRouteFileList() {
        const fileList = [];
        walk(process.env.REACT_APP_PATH_CONTENT, (file) => {
            if(file.endsWith('.js')) {
                const routePath = '/' + path.posix.relative(process.env.REACT_APP_PATH_CONTENT, file);
                const absPath = path.resolve(file);
                fileList.push([absPath, routePath]);
            }
        })
        return fileList;
    }
}


const walk = function(dir, callback) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            walk(file, callback);
        } else {
            /* Is a file */
            callback(file);
        }
    });
}