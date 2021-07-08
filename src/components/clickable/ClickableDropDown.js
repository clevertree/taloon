import React from "react";
import PropTypes from "prop-types";

import ContextMenu from "../menu/ContextMenu";

import "./Clickable.css";

export default class ClickableDropDown extends React.Component {

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };


    constructor(props) {
        super(props);

            // onKeyDown: (e) => this.onKeyDown(e),
        // this.cb.onMouseLeave = e => this.onMouseLeave(e);
        this.cb.onClose = () => this.closeDropDownMenu();
        this.dropdown = React.createRef();
        this.state = {
            open: false,
            stick: false
        }

    }


    getClassName() {
        return 'clickable dropdown';
    }

    renderChildren(props = {}) {
        return [
            super.renderChildren(props),
            (this.state.open ? <ContextMenu
                key="dropdown"
                // disabled={this.props.disabled}
                x={this.state.openPosition[0]}
                y={this.state.openPosition[1]}
                options={this.props.options}
                onClose={this.cb.onClose}
                // openOverlay={this.props.openOverlay}
            /> : null)
        ];
    }

    /** Actions **/

    openDropDownMenu(e) {
        if(this.props.disabled)
            return console.error("Clickable is disabled");
        const rect = e.target.getBoundingClientRect();
        // console.log('ClickableDropDown.openDropDownMenu', rect, e.target)
        let x = rect.right;
        let y = rect.top;
        if(this.props.vertical) {
            x = rect.left;
            y = rect.bottom;
        }
        this.setState({open: true, openPosition: [x, y]});
    }

    closeDropDownMenu(e) {
        this.setState({open: false, openPosition: null, stick: false});
    }

    toggleMenu(e) {
        if (!this.state.open)
            this.openDropDownMenu(e);
        else
            this.closeDropDownMenu(e);
    }



    /** Hover **/

    hoverDropDown(e) {
        // console.log('hoverDropDown', this.state.open, this.isHoverEnabled())
        if(this.state.open === true || !this.isHoverEnabled())
            return;
        // this.getOverlay().closeAllMenus();
        this.openDropDownMenu(e);
        // setTimeout(() => {
        //     const dropdown = this.dropdown.current;
        //     dropdown && dropdown.closeAllDropDownMenusButThis();
        // }, 100);
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu(e);
    }


}
