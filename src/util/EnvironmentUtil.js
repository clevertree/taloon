export default class EnvironmentUtil {
    /** @deprecated **/
    static isBrowser() {
        return typeof window !== 'undefined' && typeof window.document !== 'undefined';;
    }

    static isNode() {
        return typeof process !== 'undefined'
            && process.versions != null
            && process.versions.node != null;
    }
}
