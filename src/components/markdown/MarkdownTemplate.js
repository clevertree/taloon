import path from "path";
import fs from "fs";

export default class MarkdownTemplate {
    constructor(markdownPath) {
        const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);
        markdownPath = path.resolve(PATH_CONTENT, markdownPath);
        this.path = markdownPath;
    }

    generate(values) {
        if (!fs.existsSync(this.path))
            throw new Error("Markdown template not found: " + this.path);
        let markdownContent = fs.readFileSync(this.path, 'utf8');

        // Replace template variables
        markdownContent = markdownContent.replace(/\${([^}]+)}/g, (match, fieldName) => {
            if(values.hasOwnProperty(fieldName)) {
                const value = values[fieldName];
                return value.toString().replace(/<[^>]*>?/gm, '');
            }
            return "";
        })

        return markdownContent.trim();
    }

}