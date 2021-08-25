import React from "react";
import PropTypes from "prop-types";

import ContextMenu from "../ContextMenu";
import "./DropDownMenu.css";
import ContextMenuContext from "../ContextMenuContext";

export default class DropDownMenu extends React.Component {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
        // openOverlay:    false
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };


    constructor(props) {
        super(props);

        // onKeyDown: (e) => this.onKeyDown(e),
        // this.cb.onMouseLeave = e => this.onMouseLeave(e);
        this.cb = {
            onClose: e => this.closeDropDownMenu(e),
            onMouseEnter: e => this.onMouseEnter(e),
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
        };
        this.dropdown = React.createRef();
        this.state = {
            open: false,
            stick: false
        }

    }


    getClassName() {
        return 'DropDownMenu';
    }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <div
                {...this.props}
                className={className}
                onClick={this.cb.onMouseInput}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                onMouseLeave={this.cb.onMouseLeave}
            >
                {this.renderChildren(this.props)}
            </div>
        );
    }

    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            props.children,
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
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


    /** User Input **/

    onMouseEnter(e) {
        // const button = e.button;
        clearTimeout(this.timeoutMouseLeave);
        this.hoverDropDown(e);
    }

    onMouseInput(e) {
        // const button = e.button;
        clearTimeout(this.timeoutMouseLeave);
        this.toggleMenu(e);
    }


    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.doAction(e);
                break;

            case 'Tab':
                // e.preventDefault();
                // const tabIndexItem = this.getOverlay().getNextTabIndexItem(this, 1);
                // console.log('TODO tabIndexItem');
                break;

            // case 'ArrowLeft':
            // case 'ArrowUp':
            // case 'ArrowDown':
            // case 'ArrowRight':
            //     console.info("Unhandled key: ", e.key);
            //     e.preventDefault();
            //     break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
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

    isHoverEnabled() {
        const enabled = !(!this.getOverlay() || !this.getOverlay().isHoverEnabled());
        return enabled;
        // const openDropDownMenus = this.getOverlayContainerElm().querySelectorAll('.dropdown-container')
        // console.log('openDropDownMenus', openDropDownMenus);
        // return openDropDownMenus.length > 0;
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu(e);
    }

    /** Overlay Context **/
    static contextType = ContextMenuContext;

    /** @return {ContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }
    getParentMenu() { return this.context.parentMenu; }

    closeAllOpenMenus() {
        const overlay = this.getOverlay();
        overlay && overlay.closeAllOpenMenus()
    }

}
