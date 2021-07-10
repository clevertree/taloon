import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import packageJson from "../package.json";
import serverConfig from "./config.json";
import semver from 'semver';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();


// Check for version upgrade
fetch(serverConfig.versionURL)
    .then(response => response.json())
    .then(manifestJSON => {
        if(!manifestJSON.minVersion)
            console.error("Error checking App version: manifest.json has no minVersion value");
        else if(semver.lte(manifestJSON.minVersion, packageJson.version))
            console.log(`Version: manifest.minVersion (${manifestJSON.minVersion}) <= package.version (${packageJson.version})`);
        else
            forceRefresh(manifestJSON.minVersion);
    })



function forceRefresh(minVersion) {
    const isRefreshed = getCookie('minVersion');
    if(isRefreshed !== minVersion) {
        console.log("Forcing an upgrade to version: ", minVersion);
        document.cookie = "minVersion=" + (minVersion) + "; path=/";
        serviceWorkerRegistration.unregister();
        document.location.reload();
    } else {
        console.error("Upgrade to version has already been forced: ", minVersion);
    }
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)===' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
