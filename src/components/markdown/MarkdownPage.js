import React from "react";
import PropTypes from "prop-types";
import Markdown from 'markdown-to-jsx';
import Utilities from "../utility/Utilities";

import './MarkdownPage.css'
import Form from "../form/Form";

const REFRESH_INTERVAL = 5000;

// noinspection HtmlRequiredAltAttribute
export default class MarkdownPage extends React.Component {
    /** Property validation **/
    static propTypes = {
        src: PropTypes.string.isRequired,
    };

    // Default Properties
    static defaultProps = {
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
        const url = Utilities.resolveContentURL(this.props.src);
        const response = await fetch(url);
        const responseType = response.headers.get('content-type');
        // console.log("response: ", response, response.headers, responseType);
        if (responseType.startsWith('text/markdown')) {
            const content = await response.text();
            this.setState({content});
        } else {
            this.setState({content: "Invalid Type: " + responseType});
        }
        if (Utilities.isDevMode()) {
            clearInterval(this.devRefreshIntervalID);
            this.devRefreshIntervalID = setTimeout(() => this.fetchSrc().then(), REFRESH_INTERVAL);
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
                    const sourceURL = Utilities.resolveContentURL(this.props.src);
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
                    action="#"
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
