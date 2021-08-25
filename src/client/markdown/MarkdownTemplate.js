import ContentUtil from "../../util/ContentUtil";

export default class MarkdownTemplate {
    constructor(markdownPath) {
        this.path = markdownPath;
    }

    async generate(values, safeValues={}) {
        let markdownContent = await ContentUtil.fetchTextFile(this.path)

        // Replace template variables
        markdownContent = markdownContent.replace(/\${([^}]+)}/g, (match, fieldName) => {
            if(safeValues.hasOwnProperty(fieldName))
                return safeValues[fieldName];
            if(values.hasOwnProperty(fieldName)) {
                const value = values[fieldName];
                return value.toString().replace(/<[^>]*>?/gm, '');
            }
            return "";
        })

        return markdownContent.trim();
    }

}