import {ObjectId} from "mongodb";
import MarkdownTemplate from "../client/markdown/MarkdownTemplate";

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
        const {deletedCount} = await collection.deleteMany(processQuery(query));
        console.log(`Deleted ${deletedCount} ${CLN_NAME}${deletedCount === 1 ? '' : 's'}`);
        return deletedCount;
    };


    /** Model **/

    const UserDocPrototype = {
        getID: function() { return this._id; },
        getEmail: function() { return this.email; },

        /** User Content Methods **/

        hasFile: async function(title) {
            const {UserPost:userPostSchema} = collections;
            return await userPostSchema.existsUserPosts({
                ownerID: this._id,
                title
            }, false);
        },

        createUserPost: async function(title, content, labels=null, location=null) {
            const {UserPost:userPostSchema} = collections;
            return userPostSchema.createUserPost(this._id, title, content, labels, location);
        },


        createFileFromTemplate: async function(markdownPath, title, values, labels=null, location=null) {
            const template = new MarkdownTemplate(markdownPath);
            let markdownContent = await template.generate(values);

            // Write file
            return await this.createUserPost(title, markdownContent, labels, location);
        }
    }


    /** Private Function **/

    function processQuery(query) {
        // if(query._id && !(query._id instanceof ObjectId))
        //     query._id = new ObjectId(query._id);
        return query;
    }

    function processDoc(doc) {
        Object.setPrototypeOf(doc, UserDocPrototype);
        return doc;
    }


    /** Run Tests **/

    collection['$test'] = async function () {
        const testUser = await createTestUser(collection);
        const query = {email: testUser.getEmail()};

        const results = await collection.queryUsers(query);
        expect(results.length).toBe(1);
        const deleteCount = await collection.deleteUsers(query);
        expect(deleteCount).toBe(1);
        // console.log(users, newUser);
    }

    return collection;
}

export async function createTestUser(userCollection, email = 'user@test.net') {
    if(!(await userCollection.existsUsers({email})))
        await userCollection.createUser(email);
    return await userCollection.getUser({email})
}
