import PropTypes from "prop-types";
import ContextMenuItem from "../item/ContextMenuItem";

import "./ContextMenuAction.css"

export default class ContextMenuAction extends ContextMenuItem {

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        onMouseInput: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.cb = {
            // onMouseInput: e => this.onMouseInput(e),
            // onKeyDown: e => this.onKeyDown(e),
        };
        this.ref = {
            // container: React.createRef()
        }
    }

    getClassName() { return super.getClassName() + ' action'; }

}

