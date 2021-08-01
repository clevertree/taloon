import './LocationButton.css';
import React from "react";

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
            location: null,
            children: "Find Location"
        }
        this.ref = {
            button: React.createRef()
        }
    }

    getClassName() { return 'location-button'; }

    render(validation) {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        return <button {...this.props}
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
            navigator.geolocation.getCurrentPosition(position => this.onLocation(position, true));
        } else {
            this.setState({
                children: "Geolocation is not supported by this browser."
            })
        }
    }

    onLocation(position, updateInput=false) {
        console.log("Location found", position.coords)
        this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        });

        const forInput = this.props.for || this.props.htmlFor;
        if(updateInput && forInput) {
            const elmInput = this.ref.button.current.form.elements[forInput];
            if(!elmInput.value)
                elmInput.value = `${position.coords.latitude},${position.coords.longitude}`
        }
    }
}

