import React from "react";
import MarkdownPage from "../markdown/MarkdownPage";
import PropTypes from "prop-types";
import AppEvents from "../event/AppEvents";
import "./Modal.css";

export default class MarkdownModal extends React.Component {
    // Property validation
    static propTypes = {
        onClose: PropTypes.func.isRequired,
    };


    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.onClick(e),
            onCloseEvent: data => this.onCloseEvent(data),
            stopPropagation: e => e.stopPropagation()
        }
        this.state = {
            status: 'open',
            error: null
        }
        this.ref = {
            modal: React.createRef()
        }
        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        AppEvents.addEventListener('modal:close', this.cb.onCloseEvent)
        AppEvents.addEventListener('form:close', this.cb.onCloseEvent);
        if(this.ref.modal.current)
            this.ref.modal.current.focus();
    }
    componentWillUnmount() {
        this._isMounted = false;
        AppEvents.removeEventListener('modal:close', this.cb.onCloseEvent)
        AppEvents.removeEventListener('form:close', this.cb.onCloseEvent)
    }

    render() {
        return <div className={"modal-container " + this.state.status}
                    onKeyDown={this.cb.onClick}
                    onClick={this.cb.onClick}>
            <div className={"modal"}
                 ref={this.ref.modal}
                 tabIndex={0}
                onClick={this.cb.stopPropagation}>
                <div className="modal-header">
                    Title
                    <div className="button-close"
                         onClick={this.cb.onClick}>X</div>
                </div>
                {this.state.error ? <div className="modal-error">{this.state.error}</div> : null}
                <MarkdownPage
                    refreshInterval={5000}
                    src={this.props.src}
                />
            </div>
        </div>;
    }

    async onClick(e) {
        switch(e.type) {
            case 'click': break;
            case 'keydown':
                if (e.keyCode === 27)
                    break;
                return;
            default:
                break;
        }
        await this.onCloseEvent();
    }

    async onCloseEvent(delayMS=null) {
        if(typeof delayMS === "number") {
            console.log("Closing Modal in ", delayMS)
            await sleep (delayMS);
        }
        if(!this._isMounted)
            return console.info("Modal unmounted. Closing canceled");
        console.log("Closing Modal", this);
        try {
            this.setState({status: 'closing'});
            await sleep (500);
            if(!this._isMounted)
                return console.info("Modal unmounted. Closing canceled");
            this.setState({status: 'closed'});
            this.props.onClose();

        } catch (e) {
            this.setState({status: 'error', error: e.message});
        }
    }
}


async function sleep(ms) {
    await new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    });
}