import UserDoc from "./UserDoc";

export default class UserCollection {
    static NAME = 'user';
    static async initiateCollection(db) {
        const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(this.NAME);
        let collection = collectionExists ? db.collection(this.NAME) : await db.createCollection(this.NAME);

        const options = {
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
        }
        await db.command({
            collMod: this.NAME,
            ...options,
        })
        await collection.createIndex( { email: 1 }, { unique: true } );
    }

    constructor(db) {
        this.db = db;
        this.collection = db.collection(this.constructor.NAME);
    }


    async searchUsers(query) {
        const userDocs = await new Promise((resolve, reject) => {
            this.collection
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
        await this.collection.insertOne(userDoc);
        console.log(`Created user: `, userDoc);
        return new UserDoc(userDoc, this.db);
    }

}
