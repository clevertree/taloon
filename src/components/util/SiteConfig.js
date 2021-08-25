export default class SiteConfig {

    static async loadSiteConfig() {
        if(this.siteConfig)
            return this.siteConfig;
        const configURL = new URL('config.json', process.env.REACT_APP_API_ENDPOINT)+'';
        const res = await fetch(configURL);
        this.siteConfig = await res.json();
        return this.siteConfig;
    }
}