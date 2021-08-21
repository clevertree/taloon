export default class GeoLocation {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        const isLatitude = lat => isFinite(lat) && Math.abs(lat) <= 90;
        const isLongitude = lat => isFinite(lat) && Math.abs(lat) <= 180;
        if(!isLatitude)
            throw new Error("Invalid latitude: " + latitude);
        if(!isLongitude)
            throw new Error("Invalid longitude: " + longitude);
    }

    getCoordinates() { return [this.latitude, this.longitude]; }

    toString() {
        return `${this.latitude},${this.longitude}`;
    }

    static fromString(coordinateString) {
        let [lon, lat] = coordinateString.split(/\s*[\s,]\s*/, 2).map(l => parseFloat(l));
        return new GeoLocation(lon, lat);
    }
}