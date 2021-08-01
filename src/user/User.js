import path from "path";
import fs from "fs";

export default class LocalUser {
    constructor(email) {
        this.email = email;
    }

    getLocalPath(fileName=null) {
        let filePath = LocalUser.getPrivateUserPath(this.email);
        if(fileName !== null)
            filePath = path.resolve(filePath, fileName);
        return filePath;
    }

    hasFile(fileName) {
        const filePath = this.getLocalPath(fileName);
        return fs.existsSync(filePath);
    }

    writeFile(fileName, fileContent) {
        if(!fileName)
            throw new Error("Invalid file name");
        const filePath = this.getLocalPath(fileName);
        const dirPath = path.dirname(filePath);
        console.info("Writing to file: ", filePath);
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(filePath, fileContent);
        // TODO: process and index
    }

    static getPrivateUserPath(email) {
        const [user, domain] = email.split('@');
        return path.resolve(process.env.REACT_APP_PATH_PRIVATE, 'user', domain, user);
    }
}