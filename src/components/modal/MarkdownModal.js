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
            onClose: e => this.onClose(e),
            stopPropagation: e => e.stopPropagation()
        }
        this.state = {
            status: 'open',
            error: null
        }
        this.ref = {
            modal: React.createRef()
        }
    }

    componentDidMount() {
        AppEvents.addEventListener('form:success', this.cb.onClose);
        if(this.ref.modal.current)
            this.ref.modal.current.focus();
    }
    componentWillUnmount() {
        AppEvents.removeEventListener('form:success', this.cb.onClose)
    }

    render() {
        return <div className={"modal-container"}
                    onKeyDown={this.cb.onClose}
                    onClick={this.cb.onClose}>
            <div className={"modal " + this.state.status}
                 ref={this.ref.modal}
                 tabIndex={0}
                onClick={this.cb.stopPropagation}>
                <div className="modal-header">
                    Title
                    <div className="button-close"
                         onClick={this.cb.onClose}>X</div>
                </div>
                {this.state.error ? <div className="modal-error">{this.state.error}</div> : null}
                <MarkdownPage
                    refreshInterval={5000}
                    src={this.props.src}
                />
            </div>
        </div>;
    }

    async onClose(e) {
        switch(e.type) {
            case 'click': break;
            case 'keydown':
                if (e.keyCode === 27)
                    break;
                return;
            default: return;
        }
        try {
            this.setState({status: 'closing'});
            await sleep (500);
            this.props.onClose();
            this.setState({status: 'closed'});

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