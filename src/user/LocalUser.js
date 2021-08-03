import path from "path";
import fs from "fs";
import UserList from "./UserList";

export default class LocalUser {
    constructor(email, id=null, data=null) {
        this.email = email;
        this.id = id;
        this.data = data;
    }

    getRelativePath(subPath=null) {
        const paddedUserID = this.id.padEnd(8, '0');
        const part1 = paddedUserID.substr(0, 4);
        const part2 = paddedUserID.substr(4);
        return path.join(process.env.REACT_APP_PATH_USER, part1, part2, subPath);
    }

    hasFile(fileName) {
        const relativePath = this.getRelativePath(fileName);
        const absolutePath = path.join(PATH_CONTENT, relativePath)
        return fs.existsSync(absolutePath);
    }

    writeFile(fileName, fileContent) {
        if(!fileName)
            throw new Error("Invalid file name");
        const relativePath = this.getRelativePath(fileName);
        const absolutePath = path.join(PATH_CONTENT, relativePath)
        const dirPath = path.dirname(absolutePath);
        console.info("Writing to file: ", relativePath);
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(absolutePath, fileContent);
        // TODO: process and index
        return relativePath;
    }


    static async loadFromEmail(email, orCreate=false) {
        const userList = new UserList();
        let foundUser = await userList.searchUser(user => user.email === email);
        if(foundUser)
            return foundUser;
        if(!orCreate)
            throw new Error("User not found: " + email)
        return await userList.createUserID(email);
    }
}

const PATH_CONTENT = path.resolve(path.join(process.env.REACT_APP_PATH_CONTENT));
