import React from "react";

export default class SearchResults extends React.Component {

    getClassName() { return 'search-results'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;

        return <table className={className} />;
    }
}