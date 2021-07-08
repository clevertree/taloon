import React from "react";
import PropTypes from "prop-types";
import Markdown from 'markdown-to-jsx';
import Utilities from "../utility/Utilities";
import 'github-markdown-css/github-markdown.css';

let devRefreshIntervalID = null
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
        // console.log('props', props);
    }

    componentDidMount() {
        this.fetchSrc().then();
    }

    componentWillUnmount() {
        clearInterval(devRefreshIntervalID);
    }

    async fetchSrc() {
        const url = Utilities.resolveContentURL(this.props.src);
        console.log("Fetching: ", url);
        const response = await fetch(url);
        // console.log("response: ", response);
        const content = await response.text();
        this.setState({content});
        if(Utilities.isDevMode()) {
            clearInterval(devRefreshIntervalID);
            devRefreshIntervalID = setTimeout(() => this.fetchSrc().then(), 2000);
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
