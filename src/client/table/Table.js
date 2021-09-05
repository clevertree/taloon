import React from "react";
import "./Table.css";


export default class Table extends React.Component {

    componentDidMount() {
        console.log(this.props);
    }

    render() {
        return <table {...this.props} />;
    }
}