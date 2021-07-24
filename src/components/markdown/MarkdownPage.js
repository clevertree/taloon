import React from "react";
import PropTypes from "prop-types";
import Markdown from 'markdown-to-jsx';

import './MarkdownPage.css'
import Form from "../form/Form";
import Select from "../form/input/Select";
import TextArea from "../form/input/TextArea";
import Input from "../form/input/Input";


// noinspection HtmlRequiredAltAttribute
export default class MarkdownPage extends React.Component {
    /** Property validation **/
    static propTypes = {
        src: PropTypes.string.isRequired
    };

    // Default Properties
    static defaultProps = {
        refreshInterval: 5000,
        onEachTag: function (tagName, props) {}
    };


    constructor(props) {
        super(props);
        this.state = {
            content: null
        }
        this.options = {
            createElement: (type, props, children) => this.createElement(type, props, children),
        };
        this.devRefreshIntervalID = null
        this.devRefreshIntervalAmount = props.refreshInterval || 5000;
        // console.log('props', props);
    }

    componentDidMount() {
        this.fetchSrc().then();
    }

    componentWillUnmount() {
        clearInterval(this.devRefreshIntervalID);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.src !== prevProps.src)
            this.fetchSrc().then();
    }

    async fetchSrc(options={}) {
        const url = resolveContentURL(this.props.src);

        options.cache = "force-cache";
        const response = await fetch(url, options);
        const responseType = response.headers.get('content-type');
        // console.log("response: ", response, response.headers, responseType);
        if (responseType.startsWith('text/markdown')) {
            const content = await response.text();
            this.setState({content});
        } else {
            this.setState({content: "Invalid Type: " + responseType});
        }
        if (isDevMode()) {
            clearInterval(this.devRefreshIntervalID);
            // this.devRefreshIntervalID = setTimeout(() => this.fetchSrc().then(), this.devRefreshIntervalAmount);
        }
    }

    render() {
        let className = 'markdown-body';
        if (this.props.className)
            className += ' ' + this.props.className;
        const options = Object.assign({}, this.options, this.props.options || {});
        return (
            <Markdown className={className} options={options}>
                {this.state.content || "Loading " + this.props.file}
            </Markdown>
        );
    }

    createElement(type, props, children) {
        if (this.props.onEachTag)
            this.props.onEachTag(type, props, children);
        switch(type) {
            case 'meta':
                return null;
            case 'img':
                let src = props.src;
                if (props.src) {
                    const sourceURL = resolveContentURL(this.props.src);
                    src = new URL(props.src, sourceURL).toString();
                }
                // console.log(tagName, props);
                return <img src={src} alt={props.alt} className={props.className}/>;
            case 'form':
                return <Form
                    {...props}
                    className={props.className || "theme-default"}
                    method="post"
                    children={children}
                />;
            case 'input':       return <Input {...props} />
            case 'textarea':    return <TextArea {...props} />
            case 'select':      return <Select {...props} children={children}/>

            // Filter out dangerous tags
            case 'iframe':
            case 'script':
            case 'applet':
                console.error("Filtered out Tag: ", type);
                type = 'div';
                break;
            default:
        }
        return React.createElement(type, props, children)
    }

}


function resolveContentURL(src) {
    const contentURL = new URL(process.env.REACT_APP_PATH_CONTENT + '/', document.location.origin).toString();
    return new URL(src, contentURL).toString();
}

function isDevMode() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}

