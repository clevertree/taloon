import React from "react";

import ContextMenuContext from "./ContextMenuContext";

let menuIDCounter=0;
export default class ContextMenu extends React.Component {

    constructor(props) {
        super(props);
        this.ref = null
    }

    /** Menu Context **/
    static contextType = ContextMenuContext;

    /** @return {ContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }

    componentDidMount() {
        /** @return {MenuOptionList} **/
        const parentMenu = this.context.parentMenu;
        let menuPath = parentMenu ? parentMenu.props.menuPath : '';
        menuPath += (menuPath ? '-' : '' ) + menuIDCounter++;
        const props = Object.assign({
            menuPath,
            parentMenu
        }, this.props);
        this.getOverlay().openContextMenu(props);
    }

    render() {
        return null;
    }

}
