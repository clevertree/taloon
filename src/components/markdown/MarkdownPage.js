import React from "react";
import PropTypes from "prop-types";
import Markdown from 'markdown-to-jsx';
import Utilities from "../utility/Utilities";

import './MarkdownPage.css'

const REFRESH_INTERVAL = 5000;

// noinspection HtmlRequiredAltAttribute
export default class MarkdownPage extends React.Component {
    /** Property validation **/
    static propTypes = {
        src: PropTypes.string.isRequired,
    };


    constructor(props) {
        super(props);
        this.state = {
            content: null
        }
        this.options={
            overrides: {
                img: (props) => this.processTag('img', props),
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

    async fetchSrc() {
        const url = Utilities.resolveContentURL(this.props.src);
        const response = await fetch(url);
        const responseType = response.headers.get('content-type');
        // console.log("response: ", response, response.headers, responseType);
        if(responseType.startsWith('text/markdown')) {
            const content = await response.text();
            this.setState({content});
        } else {
            this.setState({content: "Invalid Type: " + responseType});
        }
        if(Utilities.isDevMode()) {
            clearInterval(this.devRefreshIntervalID);
            this.devRefreshIntervalID = setTimeout(() => this.fetchSrc().then(), REFRESH_INTERVAL);
        }
    }

    render() {
        let className = 'markdown-body';
        if(this.props.className)
            className += ' ' + this.props.className;
        return (
            <Markdown {...this.props} src={null} className={className} options={this.options}>
                {this.state.content || "Loading " + this.props.file}
            </Markdown>
        );
    }

    processTag(tagName, props) {
        let src = props.src;
        if(src) {
            const sourceURL = Utilities.resolveContentURL(this.props.src);
            src = new URL(props.src, sourceURL).toString();
        }
        // console.log(tagName, props);
        return <img {...props} src={src}/>
    }
}
