import serverConfig from "../../.config.json";

export default class Utilities {
    static isDevMode() {
        return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    }

    static resolveContentURL(src) {
        let config = serverConfig;
        if(this.isDevMode())
            config = config.dev;
        if(!config.contentURL)
            return src;
        const contentURL = new URL(config.contentURL, document.location.origin).toString();
        return new URL(src, contentURL).toString();
    }
}

