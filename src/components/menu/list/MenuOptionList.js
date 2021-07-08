import React from "react";

import ContextMenuContext from "../ContextMenuContext";
import "./MenuOptionList.css";
import ContextMenuItem from "../item/ContextMenuItem";

export default class MenuOptionList extends React.Component {

    /** Menu Context **/
    static contextType = ContextMenuContext;

    /** @return {ContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }

    /** @return {MenuOptionList} **/
    getParentMenu() { return this.props.parentMenu || this.context.parentMenu; }

    constructor(props) {
        super(props);
        this.state = {
            offset: 0,
            limit: 25,
            options: null,
            positionSelected: this.props.positionSelected || null
        }
        this.ref = {
            container: React.createRef(),
            options: []
        }
        this.cb = {
            onKeyDown: e => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        }
        // console.log(`${this.constructor.name}.constructor`, props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        if(this.props.floating !== false)
            this.updateScreenPosition();

        // if(this.props.options !== prevProps.options) {
        //     this.processOptions();
        // }
    }


    componentDidMount() {
        // this.processOptions();
        if(this.props.floating !== false)
            this.updateScreenPosition();
    }


    render() {
        return <ContextMenuContext.Provider
            value={{overlay: this.getOverlay(), parentMenu: this}}>
            {this.renderContent()}
        </ContextMenuContext.Provider>
    }

    renderContent() {
        let optionArray = this.getOptions();

        let className = 'MenuOptionList';
        // if (this.props.vertical)
        //     className += ' vertical';
        const style = {};
        if(this.props.floating !== false) {
            className += ' floating';
            if (this.props.x || this.props.y) {
                if (typeof this.props.x !== "undefined") {
                    style.left = this.props.x;
                }
                if (typeof this.props.y !== "undefined") {
                    style.top = this.props.y;
                }
            }
        }

        // const positionSelected = this.state.positionSelected;

        return <div
            style={style}
            className={className}
            ref={elm => {
                elm && elm.addEventListener('wheel', this.cb.onWheel, {passive: false});
                this.ref.container.current = elm;
            }}
            children={optionArray}
            tabIndex={0}
            onKeyDown={this.cb.onKeyDown}
        />;
    }

    /** Options **/

    getOptions() {
        let options = this.state.options || this.props.options;
        if (typeof options === "function")
            options = options(this);
        if(options instanceof Promise) {
            return [<ContextMenuItem>Loading...</ContextMenuItem>];
            // throw new Error("Promise unsupported");
            // this.setState({options: [<ASUIMenuItem>Loading...</ASUIMenuItem>]})
            // options = await options;
        }
        return options;
    }

    /** Actions **/

    updateScreenPosition() {
        if(!this.ref.container.current)
            return;
        const div = this.ref.container.current;
        div.classList.remove('overflow-right', 'overflow-bottom');
        const rect = div.getBoundingClientRect();
        div.classList.toggle('overflow-right', rect.right > window.innerWidth);
        div.classList.toggle('overflow-bottom', rect.bottom > window.innerHeight);
        // console.log('rect.right > window.innerWidth', rect.right, window.innerWidth, rect.right > window.innerWidth, rect, div);
    }


    focus() {
        if(this.ref.container.current)
            this.ref.container.current.focus({ preventScroll: true });
        else
            console.warn('this.divRef.current was ', this.ref.container.current);
    }


    /** Menu Overlay **/

    // updateOverlay() {
    //     const overlay = this.getOverlay();
    //     if(!overlay)
    //         return;
    //
    //     const isOpen = overlay.getOpenMenuCount() > 0;
    //     // const isOpen = this.getOverlayContainerElm().querySelectorAll('.dropdown-container').length > 0;
    //     // console.log('isOpen', isOpen, overlay.openMenus);
    //     overlay.toggleOverlay(isOpen);
    // }




}


