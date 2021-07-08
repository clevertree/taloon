import React from "react";

import './ContextMenuItem.css';

export default class ContextMenuItem extends React.Component {

    getClassName() { return 'menu-item'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <div
                {...this.props}
                className={className}
            >
                {this.props.children}
            </div>
        );
    }

}
