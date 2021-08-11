import UserDoc from "./UserDoc";

export default class UserDB {
    static TABLE = 'user';

    constructor(db) {
        this.db = db;
        this.collection = null;
    }

    async getCollection() {
        if(this.collection)
            return this.collection;
        this.collection = this.db.collection(UserDB.TABLE);
        await this.db.command({
            collMod: UserDB.TABLE,
            validator: {
                $jsonSchema: {
                    required: ["email"],
                    properties: {
                        email: {
                            bsonType: "string",
                            pattern: "^.+\@.+$",
                            description: "required and must be a valid email address"
                        },
                    }
                }
            },
            validationLevel: "moderate",
            validationAction: "error"
        })

        await this.collection.createIndex( { email: 1 }, { unique: true } );
        return this.collection;
    }

    async searchUsers(query) {
        const collection = await this.getCollection();
        const userDocs = await new Promise((resolve, reject) => {
            collection
                .find(query)
                .toArray((err, result) => err ? reject(err) : resolve(result));
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
        const collection = await this.getCollection();
        await collection.insertOne(userDoc);
        console.log(`Created user: `, userDoc);
        return new UserDoc(userDoc, this.db);
    }

}
