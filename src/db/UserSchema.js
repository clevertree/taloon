import MarkdownTemplate from "../client/markdown/MarkdownTemplate";
import {ObjectId} from "mongodb";

export default async function UserSchema(db, collections) {
    const CLN_NAME = 'User';
    const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(CLN_NAME);
    let collection = collectionExists ? db.collection(CLN_NAME) : await db.createCollection(CLN_NAME);

    /** Collection SCHEMA **/
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
        // validationAction: "warn"
    }
    await db.command({
        collMod: CLN_NAME,
        ...options,
    })

    /** Create Indices **/
    await collection.createIndex({email: 1}, {unique: true});

    /** Helper methods **/
    collection.queryUsers = async function (query) {
        const cursor = collection.find(processQuery(query));
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    collection.getUserByID = async function (_id, throwException=true) {
        return await collection.getUser({_id}, throwException);
    };
    collection.getUser = async function (query, throwException=true) {
        const doc = await collection.findOne(processQuery(query));
        if (!doc) {
            if(throwException)
                throw new Error(`${CLN_NAME} not found ${JSON.stringify(query)}`);
            return null;
        }
        return processDoc(doc);
    };
    collection.existsUsers = async function (query) {
        return await collection.find(processQuery(query)).limit(1).count() > 0;
    };
    collection.createUser = async function (email) {
        if(await this.existsUsers({email}))
            throw new Error(`${CLN_NAME} already exists: ${email}`);
        let newDoc = {email};
        const {insertedId} = await collection.insertOne(newDoc);
        newDoc = await collection.findOne({_id: insertedId});
        console.log(`Created ${CLN_NAME}: `, newDoc);
        return processDoc(newDoc);
    };
    collection.deleteUsers = async function (query) {
        const result = await collection.deleteMany(processQuery(query));
        console.log(`Deleted ${result.deletedCount} ${CLN_NAME}${result.deletedCount === 1 ? '' : 's'}`);
        return result;
    };


    /** Model **/

    const UserPrototype = {
        getID: function() { return this._id; },
        getEmail: function() { return this.email; },
        getTitle: function() { return this.title || this.email.split('@')[0]; },

        /** User Content Methods **/

        hasFile: async function(filename) { return !!await this.getFile(filename); },
        getFile: async function(filename) {
            const {UserFile:userFileSchema} = collections;
            return await userFileSchema.getUserFile({
                ownerID: this._id,
                filename
            }, false);
        },

        createFile: async function(filename, stream=null, metadata={}) {
            const {UserFile:userFileSchema} = collections;
            return await userFileSchema.createUserFile(this._id, filename, stream, metadata);
        },


        createFileFromTemplate: async function(markdownPath, filename, values, metadata= {}) {
            const template = new MarkdownTemplate(markdownPath);
            let markdownContent = await template.generate(values);

            // Write file
            return await this.createFile(filename, markdownContent, metadata);
        },

        delete: async function() {
            return await collection.deleteUsers({_id: this._id});
        }
    }
    collection.DocumentPrototype = UserPrototype;


    /** Private Function **/

    function processQuery(query) {
        if(query._id && !(query._id instanceof ObjectId))
            query._id = new ObjectId(query._id);
        return query;
    }

    function processDoc(doc) {
        Object.setPrototypeOf(doc, UserPrototype);
        return doc;
    }


    /** Run Tests **/

    collection['$test'] = async function () {
        const testUser = await createTestUser(collection);
        const query = {email: testUser.getEmail()};

        const results = await collection.queryUsers(query);
        expect(results.length).toBe(1);
        const {deletedCount} = await collection.deleteUsers(query);
        expect(deletedCount).toBe(1);
        // console.log(users, newUser);
    }

    return collection;
}

export async function createTestUser(userCollection, email = 'user@test.net') {
    if(!(await userCollection.existsUsers({email})))
        await userCollection.createUser(email);
    return await userCollection.getUser({email})
}
