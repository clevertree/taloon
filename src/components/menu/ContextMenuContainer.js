import React from "react";
import ContextMenuContainerBase from "./ContextMenuContainerBase";

import MenuOptionList from "./list/MenuOptionList";
import "./style/ContextMenuContainer.css"

export default class ContextMenuContainer extends ContextMenuContainerBase {

    renderContent() {
        let className = (this.props.className ? this.props.className + ' ' : '') + 'ContextMenuContainer';

        // this.ref.openMenus = [];
        // this.ref.slidingMenu = React.createRef()
        const openOverlay = this.state.slidingMenu || this.state.openMenus.length > 0;
        return (
            <div
                className={className}>
                <div
                    key="overlay"
                    className={`overlay${openOverlay ? ' open' : ''}`}
                    onClick={this.cb.closeAllOpenMenus}
                    // onContextMenu={this.cb.closeAllMenus}
                >
                </div>
                {this.props.portrait ? <div
                    className={`sliding-menu${this.state.slidingMenu ? ' open' : ''}`}>
                    {this.renderSlidingMenu()}
                </div> : null}
                <div
                    className={`open-menus${this.state.openMenus.length > 0 ? ' open' : ''}`}>
                    {this.state.openMenus.map((openMenu, i) => <MenuOptionList
                        key={i}
                        {...openMenu}
                    />)}
                </div>
                {this.props.children}
            </div>
        );
    }


}
