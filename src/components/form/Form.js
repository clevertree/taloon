import React from "react";
import "./Form.css";

export default class Form extends React.Component {

    getClassName() { return 'theme-default'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        return <form {...this.props} className={className} />;
    }
}
