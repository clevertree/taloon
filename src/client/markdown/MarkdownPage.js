import React from "react";
import PropTypes from "prop-types";
import Markdown from 'markdown-to-jsx';

import './MarkdownPage.css'
import Select from "../form/input/Select";
import TextArea from "../form/input/TextArea";
import Input from "../form/input/Input";
import FieldSet from "../form/FieldSet";
import SessionButton from "../session/SessionButton";
import LocationButton from "../location/LocationButton";
import Form from "../form/Form";
import SearchResults from "../search/SearchResults";


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
            content: null,
            status: 200,
            // contentPath: this.props.src,
        }
        this.options = {
            createElement: this.createElement.bind(this),
        };
        // this.formCount = 0;
        this.devRefreshIntervalID = null
        this.devRefreshIntervalAmount = props.refreshInterval || 5000;
        this.mounted = false;
    }

    componentDidMount() {
        this.mounted = true;
        this.fetchSrc().then();
    }

    componentWillUnmount() {
        this.mounted = false;
        clearTimeout(this.devRefreshIntervalID);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.src !== prevProps.src)
            this.fetchSrc().then();
    }


    async fetchSrc(options={
        cache: "force-cache",
        headers: {
            'Content-Type': 'text/markdown',
        }
    }) {
        const contentURL = new URL(this.props.src, process.env.REACT_APP_API_ENDPOINT).toString();

        if(!this.mounted) return;
        this.setState({loading: true});
        const response = await fetch(contentURL, options);
        if(!this.mounted) return;
        this.setState({loading: false});
        const responseType = response.headers.get('content-type');
        // console.log("response: ", response, response.headers, responseType);
        // if(response.status !== 200) {
        //     this.setState({content: "Markdown file not found: " + this.props.src});

        let content = await response.text();
        const newState = {content, status: response.status, isMarkdown: responseType.startsWith('text/markdown')};
        // if(response.headers.get('content-path'))
        //     newState.contentPath = response.headers.get('content-path');
        // content = replaceStringParameters(content, replaceParams);
        if(!this.mounted) return;
        this.setState(newState);

        if (process.env.NODE_ENV === 'development') {
            clearTimeout(this.devRefreshIntervalID);
            this.devRefreshIntervalID = setTimeout(() => this.fetchSrc().then(), this.devRefreshIntervalAmount);
        }
    }

    render() {
        let className = 'markdown-body';
        if (this.props.className)
            className += ` ${this.props.className}`;
        const options = Object.assign({}, this.options, this.props.options || {});
        let content = this.state.content || "# No Content";
        // if(this.state.loading) {
        //     content = "# Loading: " + this.props.file;
        //     className += ' loading';
        // }
        if(this.state.status !== 200) {
            className += ' error';
        }
        return (
            <Markdown
                className={className}
                options={options}>
                {content}
            </Markdown>
        );
    }

    createElement(type, props, children) {
        const contentURL = new URL(this.props.src, process.env.REACT_APP_API_ENDPOINT).toString();
        if (this.props.onEachTag)
            this.props.onEachTag(type, props, children);
        // console.log('createElement', type, props, children)
        switch(type) {
            case 'meta':        return null;
            case 'a':           return <A {...props} children={children} />;
            case 'img':         return <Img {...props} src={new URL(props.src, contentURL).toString()} />;
            case 'form':
                return <Form
                    {...props}
                    className={props.className || "theme-default"}
                    markdownPath={this.props.src}
                    method="post"
                    children={children}
                />;
            case 'fieldset':    return <FieldSet {...props} children={children}/>
            case 'input':       return <Input {...props} />
            case 'textarea':    return <TextArea {...props} />
            case 'select':      return <Select {...props} children={children}/>

            case 'results': return <SearchResults {...props} children={children}/>

            case 'session':     return <SessionButton {...props} />
            case 'location':    return <LocationButton {...props} />
            // Filter out dangerous tags
            case 'iframe':
            case 'script':
            case 'applet':
                console.warn("Filtered out Tag: ", type);
                type = 'div';
                break;
            default:
        }
        return React.createElement(type, props, children)
    }

}


function Img(props) {
    return <img {...props} alt={props.alt} />;
}

function A(props) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a {...props}/>;
}
