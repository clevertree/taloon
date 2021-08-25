import React, {Component} from "react";
import packageJSON from '../package.json';

import MarkdownPage from "./components/markdown/MarkdownPage";
import MarkdownModal from "./components/modal/MarkdownModal";

import AppEvents from "./components/event/AppEvents";

import 'typeface-open-sans/index.css'
import './components/menu/style/Menu.css';
import './AppTheme.css';

const TIMEOUT_REDIRECT = 5000;

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portrait: false,
            title: "The Traveling Merchant",
            pathname: document.location.pathname + document.location.search,
            activeModal: null
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
            handleClick: this.handleClick.bind(this),
            handlePopState: this.handlePopState.bind(this),
            handleRedirect: this.handleRedirect.bind(this),
            onEachTag: (tagName, props) => this.onEachTag(tagName, props),
            showModal: (path) => this.showModal(path),
            closeModal: (timeout) => this.closeModal(timeout)
        };
    }

    componentDidMount() {
        document.addEventListener('click', this.cb.handleClick);
        window.addEventListener('popstate', this.cb.handlePopState);
        AppEvents.addEventListener('modal:show', this.cb.showModal);
        AppEvents.addEventListener('redirect', this.cb.handleRedirect);
        // AppEvents.addEventListener('modal:close', this.cb.closeModal)
        // this.loadSiteConfig();
    }
    componentWillUnmount() {
        document.removeEventListener('click', this.cb.handleClick);
        window.removeEventListener('popstate', this.cb.handlePopState);
        AppEvents.removeEventListener('modal:show', this.cb.showModal)
        AppEvents.removeEventListener('redirect', this.cb.handleRedirect);
        // AppEvents.removeEventListener('modal:close', this.cb.closeModal)
    }

    render() {
        let className = 'App theme-default ' + (this.state.portrait ? 'portrait' : 'landscape');
        // TODO: loading config
        return (
            <AppContext.Provider value={this}>
                <div className={className} >
                    {this.renderHeader()}
                    {this.renderContent()}
                    {this.renderFooter()}
                    Version: {packageJSON.version}
                    {this.state.activeModal}
                </div>
            </AppContext.Provider>
        );
    }


    renderHeader() {
        let src = `/${process.env.REACT_APP_PATH_SITE}/header.md`;
        return <MarkdownPage
            refreshInterval={50000}
            options={{wrapper: 'header', forceWrapper: true}}
            src={src}
            />;
    }

    renderFooter() {
        let src = `/${process.env.REACT_APP_PATH_SITE}/footer.md`;
        return <MarkdownPage
            refreshInterval={50000}
            options={{wrapper: 'footer', forceWrapper: true}}
            src={src}
            />;
    }


    renderContent() {
        let src = "./index.md";
        if(this.state.pathname)
            src = this.state.pathname.toString();
        // if(src[0] === '/')
        //     src = '.' + src;
        // if(!src.endsWith('.md')) {
        //     if(src.endsWith('/'))
        //         src += 'index.md';
        //     else if(!src.endsWith('.md'))
        //         src += '.md';
        // }
        // console.log('src', src);
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
                this.handleRedirect(pathname, 0);
            }
        }
    }

    handlePopState(e) {
        console.log("Pop State: " + document.location.pathname + ", state: " + JSON.stringify(e.state));
        this.setState({
            pathname:document.location.pathname
        });
    }

    handleRedirect(pathname, timeout=TIMEOUT_REDIRECT) {
        setTimeout(() => {
            console.info("Redirecting to ", pathname, 'in', timeout);
            this.setState({
                pathname
            });
            window.history.pushState({}, null, new URL(pathname, document.location.origin)+'');
            window.scroll({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }, timeout);
    }

    showModal(markdownPath, modalOptions={}) {
        // console.log("Showing Modal: ", markdownPath);
        this.setState({
            activeModal: <MarkdownModal
                {...modalOptions}
                src={markdownPath}
                onClose={this.cb.closeModal}
            />
        })
        // console.log("Closing Modal: ", {result, markdownPath});
        // this.setState({
        //     activeModal: null
        // })
    }

    closeModal() {
        // console.log("Closing Modal: ", this.state.activeModal);
        this.setState({
            activeModal: null
        })
    }

}

export default App;

export const AppContext = React.createContext(null);