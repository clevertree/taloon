import ContextMenuContainer from "./components/menu/ContextMenuContainer";
import React, {Component} from "react";
import DropDownMenu from "./components/menu/dropdown/DropDownMenu";
import './App.css';
import MarkdownPage from "./components/markdown/MarkdownPage";


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portrait: false,
            title: "The Traveling Merchant"
        };

        this.ref = {
            container: React.createRef(),
            menu: {
                contextContainer: React.createRef(),
                // file: React.createRef(),
                // playback: React.createRef(),
            }
        }
        this.cb = {
            menu: {
                'root':     () => this.renderSubMenu(),
                'file':     () => this.renderSubMenu(),
                'view':     () => this.renderSubMenu(),
                'options':  () => this.renderSubMenu(),
                'server':   () => this.renderSubMenu(),
            }
        };
    }

    render() {
        let className = 'App ' + (this.state.portrait ? 'portrait' : 'landscape');
        return (
            <ContextMenuContainer
                className={className}
                ref={this.ref.menu.contextContainer}
                portrait={this.state.portrait}
            >
                {this.renderHeader()}
                {this.renderContent()}
                {this.renderFooter()}
            </ContextMenuContainer>
        );
    }


    renderHeader() {
        let src = "./header.md";
        return <MarkdownPage
            className={"header"}
            src={src}
        />
    }

    renderFooter() {
        let src = "./footer.md";
        return <MarkdownPage
            className={"footer"}
            src={src}
        />
    }


    renderContent() {
        let src = "./index.md";
        const currentPath = document.location.pathname;
        if(currentPath && currentPath !== '/')
            src = currentPath + '/index.md';
        return <MarkdownPage
            className={"content"}
            src={src}
        />
    }

    renderRootMenu(ref={}, vertical=true) {
        const props = {
            vertical,
            // vertical: !this.state.portrait,
            openOnHover: false,
        };
        if(!this.state.portrait)
            props.arrow = false;
        return (<>
            <DropDownMenu {...props} ref={ref.file} options={this.cb.menu.file}         >File</DropDownMenu>
            <DropDownMenu {...props} ref={ref.view} options={this.cb.menu.view}         >View</DropDownMenu>
            <DropDownMenu {...props} ref={ref.options} options={this.cb.menu.options}      >Options</DropDownMenu>
            <DropDownMenu {...props} ref={ref.server} options={this.cb.menu.server}       >Server</DropDownMenu>
        </>);
    }

    renderSubMenu() {
        return (<>
            <DropDownMenu options={this.cb.menu.file}         >File</DropDownMenu>
            <DropDownMenu options={this.cb.menu.view}         >View</DropDownMenu>
            <DropDownMenu options={this.cb.menu.options}      >Options</DropDownMenu>
            <DropDownMenu options={this.cb.menu.server}       >Server</DropDownMenu>
        </>);
    }

}

export default App;
