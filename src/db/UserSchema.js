import {ObjectId} from "mongodb";
import MarkdownTemplate from "../components/markdown/MarkdownTemplate";

export default async function UserSchema(db, collections) {
    const CLN_NAME = 'user';
    const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(CLN_NAME);
    let collection = collectionExists ? db.collection(CLN_NAME) : await db.createCollection(CLN_NAME);

    // Create Collection SCHEMA
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
        collMod: CLN_NAME,
        ...options,
    })

    // Create Index
    await collection.createIndex({email: 1}, {unique: true});

    // Helper methods
    collection.queryAll = async function (query) {
        processQuery(query);
        const cursor = collection.find(query);
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    collection.queryOne = async function (query) {
        processQuery(query);
        const doc = await collection.findOne(query);
        return doc ? processDoc(doc) : null;
    };
    collection.getUser = async function (query, throwException=true) {
        const userDoc = await collection.queryOne(query)
        if(userDoc || !throwException)
            return userDoc;
        throw new Error("User not found " + JSON.stringify(query))
    };
    collection.userExists = async function (query) {
        const userDoc = await collection.queryOne(query)
        return !!userDoc;
    };
    collection.createUser = async function (email) {
        if(await this.userExists({email}))
            throw new Error("User already exists: " + email);
        let userDoc = {email};
        const {insertedId} = await collection.insertOne(userDoc);
        userDoc = collection.queryOne({_id: insertedId});
        console.log(`Created user: `, userDoc);
        return userDoc;
    };

    /** User Content Methods **/

    collection.hasFile = async function(ownerID, title) {
        const contentSchema = collections.content;
        const contentDocs = await contentSchema.queryAllContent({
            ownerID,
            title
        }, false);
        return contentDocs.length > 0;
    }

    collection.createFile = async function(ownerID, title, content, labels=null, location=null) {
        const contentSchema = collections.content;
        return contentSchema.createContent(ownerID, title, content, labels, location);
    }


    collection.createFileFromTemplate = async function(markdownPath, title, values, labels=null, location=null) {
        const template = new MarkdownTemplate(markdownPath);
        let markdownContent = template.generate(values);

        // Write file
        return await this.createFile(title, markdownContent, labels, location);
    }


    // Private Functions
    function processQuery(query) {
        if(query._id && !(query._id instanceof ObjectId))
            query._id = new ObjectId(query._id);
    }

    function processDoc(doc) {
        Object.setPrototypeOf(doc, UserDocPrototype)
    }

    const UserDocPrototype = {
        getIDString: function() { return this._id+''; },
        getEmail: function() { return this.email; }
    }

    // Run Tests
    // const newUser = await collection.createUser('omfg@wut.com');
    // const users = await collection.queryAll({});

    return collection;
}

