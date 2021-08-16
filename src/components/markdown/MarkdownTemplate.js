import path from "path";
import fs from "fs";

export default class MarkdownTemplate {
    constructor(markdownPath) {
        this.path = markdownPath;
    }

    generate(values, safeValues={}) {
        let markdownPath = this.path;
        if (!fs.existsSync(markdownPath))
            markdownPath = path.join(process.env.REACT_APP_PATH_CONTENT, this.path);
        if (!fs.existsSync(markdownPath))
            throw new Error("Markdown template not found: " + markdownPath);
        let markdownContent = fs.readFileSync(markdownPath, 'utf8');

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