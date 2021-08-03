import readline from "readline";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import LocalUser from "./LocalUser";

export default class UserList {
    async readUsers(callback) {
        if(fs.existsSync(PATH_USERLIST)) {
            const input = fs.createReadStream(PATH_USERLIST)
            const rl = readline.createInterface({
                input,
                crlfDelay: Infinity
            });
            for await (const line of rl) {
                const [id, email, ...args] = line.split("\t");

                let user = new LocalUser(email, id, args.join("\t"));
                if (callback(user) === true)
                    break;
            }
        } else {
            console.warn("User list doesn't exist: ", PATH_USERLIST);
        }
    }

    async searchUser(searchCallback) {
        let foundUser = null;
        await this.readUsers(userData => {
            if(searchCallback(userData) === true) {
                foundUser = userData;
                return true;
            }
        });
        return foundUser;
    }


    async searchUsers(searchCallback) {
        let foundUsers = [];
        await this.readUsers(userData => {
            if(searchCallback(userData) === true)
                foundUsers.push(userData);
        });
        return foundUsers;
    }

    async userExists(callback) {
        const list = await this.searchUsers();
        return list.length > 0;
    }

    async loadUserID(email, throwException=true) {
        const foundUser = await this.searchUser(user => user.email === email);
        if(!foundUser) {
            if(throwException)
                throw new Error("User not found: " + email);
            return null;
        }
        return foundUser.id;
    }


    async createUserID(email, data="") {
        if(await this.userExists(user => user.email === email))
            throw new Error("User already exists: " + email);
        let newUser = new LocalUser(email, -1, data);
        let attempts = 0;
        while(true) {
            newUser.id = await generateToken(8);
            if (await this.userExists(user => user.id === newUser.id)) {
                if(attempts++ < GEN_TOKEN_ATTEMPTS)
                    continue;
                throw new Error(`Exceeded ${GEN_TOKEN_ATTEMPTS} attempts to generate token`)
            }
            break;
        }

        const line = `${newUser.id}\t${newUser.email}${newUser.data ? '\t' + newUser.data.replace(/\n/g, "\\n") : ''}`;
        console.log(`Writing line to ${PATH_USERLIST}:\n${line}`);
        fs.appendFileSync(PATH_USERLIST, line);
        return newUser;
    }

}

const PATH_USER = path.resolve(path.join(process.env.REACT_APP_PATH_CONTENT, process.env.REACT_APP_PATH_USER));
if(!fs.existsSync(PATH_USER)) {
    console.log("Creating directory ", PATH_USER);
    fs.mkdirSync(PATH_USER, {recursive: true});
}
const PATH_USERLIST = path.join(PATH_USER, '.users');
const GEN_TOKEN_ATTEMPTS = 999;

function generateToken(byteLength = 8) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(byteLength, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString('base64').substr(0, 8));
            }
        });
    });
}