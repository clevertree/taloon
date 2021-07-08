import React from "react";
import ClickableBase from "./ClickableBase";
import "./Clickable.css";

export default class Clickable extends ClickableBase {

    constructor(props) {
        super(props);
        this.cb.onMouseEnter = e => this.onMouseEnter(e);
        this.timeoutMouseLeave = null;
    }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     return nextProps.children !== this.props.children;
    // }

    getClassName() { return 'clickable'; }

    render() {
        // console.log(this.constructor.name + '.render()', this.props);
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';
        if(this.props.loading)
            className += ' loading';
        if(this.props.size)
            className += ' ' + this.props.size;
        if(this.props.center)
            className += ' center';
        if(this.props.wide)
            className += ' wide';
        if(this.state && this.state.open)
            className += ' open';

        const props = {
            title: this.props.title,
            className,
            onClick: this.cb.onMouseInput,
            onKeyDown: this.cb.onKeyDown,
            onMouseEnter: this.cb.onMouseEnter,
            onMouseLeave: this.cb.onMouseLeave,
            ref: this.ref.container,
            children: this.renderChildren()
        }

        if(this.props.button)
            return <button {...props} />;
        return <div {...props} />;
    }

    renderChildren(props={}) {
        return this.props.children;
    }

    /** User Input **/

    onMouseEnter(e) {
        // const button = e.button;
        clearTimeout(this.timeoutMouseLeave);
        this.hoverDropDown(e);
    }

}
