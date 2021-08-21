import MarkdownTemplate from "../components/markdown/MarkdownTemplate";
import UserContentCollection from "./file/UserContentCollection";



export default class UserDoc {
    constructor(data={}, db) {
        this.data = data;
        if(!db)
            throw new Error("Invalid DB");
        this.db = db;
    }

    getID() { return this.data._id; }
    getEmail() { return this.data.email; }


    async hasFile(title) {
        const userFileDB = new UserContentCollection(this.db)
        const userFiles = await userFileDB.queryUserFiles({
            ownerID: this.getID(),
            title
        }, false);
        return userFiles.length > 0;
    }

    async createFile(title, content, labels=null, location=null) {
        const userFileDB = new UserContentCollection(this.db)
        return userFileDB.createUserFile(this.getID(), title, content, labels, location);
    }


    async createFileFromTemplate(markdownPath, title, values, labels=null, location=null) {
        const template = new MarkdownTemplate(markdownPath);
        let markdownContent = template.generate(values);

        // Write file
        return await this.createFile(title, markdownContent, labels, location);
    }



}
