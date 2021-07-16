import ContextMenuContainer from "./components/menu/ContextMenuContainer";
import React, {Component} from "react";
import packageJSON from '../package.json';

import MarkdownPage from "./components/markdown/MarkdownPage";

import 'typeface-open-sans/index.css'
import './components/menu/style/Menu.css';
import './App.css';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portrait: false,
            title: "The Traveling Merchant",
            pathname: document.location.pathname
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
            handleClick: e => this.handleClick(e),
            onEachTag: (tagName, props) => this.onEachTag(tagName, props)
        };
    }

    componentDidMount() {
        document.addEventListener('click', this.cb.handleClick);
    }
    componentWillUnmount() {
        document.removeEventListener('click', this.cb.handleClick);
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
                Version: {packageJSON.version}
            </ContextMenuContainer>
        );
    }


    renderHeader() {
        let src = "./header.md";
        return <MarkdownPage
            refreshInterval={50000}
            options={{wrapper: 'header', forceWrapper: true}}
            src={src}
            />;
    }

    renderFooter() {
        let src = "./footer.md";
        return <MarkdownPage
            refreshInterval={50000}
            options={{wrapper: 'footer', forceWrapper: true}}
            src={src}
            />;
    }


    renderContent() {
        let src = "./index.md";
        const currentPath = this.state.pathname;
        if(currentPath && currentPath !== '/')
            src = '.' + currentPath + '/index.md';

        // Remove previous meta tags
        for(const metaElm of document.head.querySelectorAll(
            "title, meta[name='description'], meta[name='keywords'], meta[name='title']")) {
            metaElm.remove();
        }

        return <MarkdownPage
            options={{wrapper: 'article', forceWrapper: true}}
            className={"content"}
            onEachTag={this.cb.onEachTag}
            src={src}
        />
    }

    /** Events **/

    onEachTag(tagName, props) {
        // console.log('tag', tagName, props);
        switch(tagName) {
            case 'meta':
                let paramName = typeof props.property !== "undefined" ? 'property' : 'name';
                const key = props[paramName];
                const content = props.content;
                switch(key.toLowerCase()) {
                    case 'title':
                        document.title = props.content;
                        break;
                    default:
                        let elm = document.head.querySelector(`meta[${props.name}="${key}"]`)
                        if(!elm) {
                            elm = document.createElement('meta');
                            elm[paramName] = key;
                            document.head.appendChild(elm);
                        }
                        elm.content = content;
                        break;
                }
                break;
            default:
                break;
        }
    }

    handleClick(e) {
        let target = e.target;
        while(target && target.nodeName.toLowerCase() !== 'a') {
            target = target.parentNode;
        }
        if(target
            && target.nodeName.toLowerCase() === 'a'
            && target.target !== '_blank') {
            // console.log("Click target: ", target);

            const url = new URL(target.href);
            if(url.origin !== window.location.origin) {
                target.setAttribute('target', '_blank');
                // Allow navigation
                // } else if(url.hash
            } else {
                let pathname = url.pathname;
                if(pathname.substr(-1, 1) !== '/'
                    && pathname.split('/').pop().indexOf('.') === -1)
                    pathname += '/'
                e.preventDefault();
                // console.log('click', target, pathname);
                // let history = useHistory();
                this.setState({
                    pathname
                });
                window.history.pushState("", null, pathname);

                window.scroll({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
            }
        }
    }



}

export default App;

