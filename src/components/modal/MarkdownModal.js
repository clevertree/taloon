import React from "react";

import MarkdownPage from "../markdown/MarkdownPage";
import "./Modal.css";

export default class MarkdownModal extends React.Component {
    render() {
        console.log("TODO", this.props)
        return <div className="modal-overlay">
            <div className="modal-container">
                <MarkdownPage
                    refreshInterval={5000}
                    src={this.props.src}
                />
            </div>
        </div>;
    }
}