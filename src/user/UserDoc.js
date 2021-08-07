import MarkdownTemplate from "../components/markdown/MarkdownTemplate";
import UserFileDB from "./file/UserFileDB";



export default class UserDoc {
    static TABLE = 'user';
    constructor(data={}, db) {
        this.data = data;
        if(!db)
            throw new Error("Invalid DB");
        this.db = db;
    }

    getEmail() { return this.data.email; }


    hasFile(path) {
        const userFileDB = new UserFileDB(this.db)
        return userFileDB.userFileExists({
            owner: this.getEmail(),
            path: path
        })
    }

    writeFile(fileName, fileContent) {
        if(!fileName)
            throw new Error("Invalid file name");
        const userFileDB = new UserFileDB(this.db)
        // TODO: process?
        return userFileDB.createUserFile({
            owner: this.getEmail(),
            path: fileName,
            content: fileContent
        })
    }


    createFileFromTemplate(fileOutputPath, markdownPath, values) {
        const template = new MarkdownTemplate(markdownPath);
        let markdownContent = template.generate(values);

        // Write file
        return this.writeFile(fileOutputPath, markdownContent);
    }


    findAvailableFile(filePrefix, start=1, end=99) {
        for(let i=start; i<end; i++) {
            let fileName = `${filePrefix}${i}.md`;
            if(!this.hasFile(fileName))
                return fileName;
        }
        return null;
    }

}
