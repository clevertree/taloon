import React from "react";

export default class TextArea extends React.Component {
    render() {
        return <textarea {...this.props}
                         defaultValue={this.props.value}
                         placeholder={this.props.placeholder.toString().replaceAll('\\n', "\n")}
                         children={null}
                         />;
    }
}

