import UserDoc from "./UserDoc";

export default class UserDB {
    constructor(db) {
        this.db = db;
    }

    async searchUsers(query) {
        const userDocs = await new Promise((resolve, reject) => {
            this.db.collection(UserDoc.TABLE)
                .find(query)
                .toArray(function(err, result) {
                    err ? reject(err) : resolve(result);
                });
        });
        return userDocs.map(userDoc => new UserDoc(userDoc, this.db));
    }

    async getUser(query, throwException=true) {
        const users = await this.searchUsers(query);
        if(users.length > 1)
            throw new Error("Multiple users found " + JSON.stringify(query))
        if(users.length === 0) {
            if(throwException)
                throw new Error("User not found " + JSON.stringify(query))
            return null;
        }
        return users[0];
    }

    async userExists(query) {
        const users = await this.searchUsers(query);
        return users.length > 0;
    }


    async createUser(email) {
        if(await this.userExists({email}))
            throw new Error("User already exists: " + email);

        const userDoc = {email};
        await this.db.collection(UserDoc.TABLE).insertOne(userDoc);
        console.log(`Created user: `, userDoc);
        return new UserDoc(userDoc, this.db);
    }

}
