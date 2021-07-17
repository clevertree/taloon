import React from "react";
import PropTypes from "prop-types";
import Markdown from 'markdown-to-jsx';

import './MarkdownPage.css'
import Form from "../form/Form";


// noinspection HtmlRequiredAltAttribute
export default class MarkdownPage extends React.Component {
    /** Property validation **/
    static propTypes = {
        src: PropTypes.string.isRequired
    };

    // Default Properties
    static defaultProps = {
        refreshInterval: 5000,
        onEachTag: function (tagName, props) {
        }
    };


    constructor(props) {
        super(props);
        this.state = {
            content: null
        }
        this.options = {
            overrides: {
                img: (props) => this.processTag('img', props),
                meta: (props) => this.processTag('meta', props),
                form: (props) => this.processTag('form', props),
                textarea: (props) => this.processTag('textarea', props),
            },
            createElement(type, props, children) {
                // Filter out dangerous tags
                switch(type) {
                    case 'iframe':
                    case 'applet':
                        type = 'div';
                        break;
                    default:
                }
                return React.createElement(type, props, children)
            },
        };
        this.devRefreshIntervalID = null
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

    async fetchSrc() {
        const url = resolveContentURL(this.props.src);

        const response = await fetch(url);
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
            this.devRefreshIntervalID = setTimeout(() => this.fetchSrc().then(), this.props.refreshInterval || 5000);
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

    processTag(tagName, props) {
        if (this.props.onEachTag)
            this.props.onEachTag(tagName, props);
        switch (tagName) {
            case 'img':
                let src = props.src;
                if (props.src) {
                    const sourceURL = resolveContentURL(this.props.src);
                    src = new URL(props.src, sourceURL).toString();
                }
                // console.log(tagName, props);
                return <img src={src} alt={props.alt} className={props.className}/>;

            case 'meta':
                return null;
            case 'form':
                return <Form
                    {...props}
                    className={props.className || "theme-default"}
                    method="post"
                    />;
            case 'textarea':
                return <textarea
                    {...props}
                    defaultValue={props.value}
                    placeholder={props.placeholder.toString().replaceAll('\\n', "\n")}
                    children={null}
                    />
            default:
                return <div>Unknown Tag: {tagName}</div>;
        }
    }
}


function resolveContentURL(src) {
    const contentURL = new URL(process.env.REACT_APP_PATH_CONTENT + '/', document.location.origin).toString();
    return new URL(src, contentURL).toString();
}

function isDevMode() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}