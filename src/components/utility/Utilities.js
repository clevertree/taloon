export default class Utilities {
    static isDevMode() {
        return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    }

}

