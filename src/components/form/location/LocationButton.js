import './LocationButton.css';
import React from "react";
import GeoLocation from "../../../db/user/GeoLocation";

const STORAGE_LOCATION = 'user:location';
export default class LocationButton extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            getLocation: e => this.getLocation(e)
            // updateSession: e => this.updateSession(),
            // showLoginModal: e => this.showLoginModal(e),
            // showLogoutModal: e => this.showLogoutModal(e),
        }
        this.state = {
            // location: null,
            children: "Find Location"
        }
        this.ref = {
            button: React.createRef()
        }
    }

    componentDidMount() {
        this.loadUserLocationFromStorage();
    }

    getClassName() { return 'button location-button'; }

    render(validation) {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        return <a
            href="?"
            className={className}
            ref={this.ref.button}
            onClick={this.cb.getLocation}
            onKeyDown={this.cb.getLocation}
            children={this.state.children}
        />;
    }

    getLocation(e) {
        switch(e.type) {
            default:
            case 'click': break;
            case 'keydown':
                if (e.keyCode === 27)
                    break;
                return;
        }
        e.preventDefault();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.onLocation.bind(this));
        } else {
            this.setState({
                children: "Geolocation is not supported by this browser."
            })
        }
    }

    onLocation(position) {
        console.log("Location found", ...arguments)
        this.updateInputLocation(position.coords.latitude, position.coords.longitude, true);
    }

    updateInputLocation(latitude, longitude, force=false) {
        const geoLocation = new GeoLocation(latitude, longitude);
        // const newState = {
        //     location: userLocation,
        // };
        // this.setState(newState);
        localStorage.setItem(STORAGE_LOCATION, JSON.stringify(geoLocation.getCoordinates()));

        const forInput = this.props.for || this.props.htmlFor;
        if(forInput) {
            const body = this.ref.button.current.closest('form, body');
            const elmInput = body.querySelector(`input[name="${forInput}"]`);
            if(!elmInput.value || force) {
                elmInput.value = geoLocation.toString();
            }
        }
    }

    loadUserLocationFromStorage() {
        let locationString = localStorage.getItem(STORAGE_LOCATION);
        if(locationString) {
            console.log("Loading user location from storage", locationString);
            const userLocation = GeoLocation.fromString(locationString);
            this.updateInputLocation(userLocation.latitude, userLocation.longitude);
        }
    }
}
