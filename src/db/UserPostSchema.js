import {ObjectId} from "mongodb";
import GeoLocation from "../client/location/GeoLocation";

export default async function UserPostSchema(db, collections) {
    const CLN_NAME = 'UserPost';
    const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(CLN_NAME);
    let collection = collectionExists ? db.collection(CLN_NAME) : await db.createCollection(CLN_NAME);

    /** Collection SCHEMA **/
    const options = {
        validator: {
            $jsonSchema: {
                required: ["ownerID", "title", "content"],
                properties: {
                    title: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    content: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    keywords: {
                        bsonType: "array",
                        items: {
                            bsonType: "string",
                        }
                    },
                    labels: {
                        bsonType: "array",
                        items: {
                            bsonType: "string",
                        }
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

    /** Create Indices **/
    await collection.createIndex({ownerID: 1, title: 1}, {unique: true});

    /** Helper methods **/
    collection.queryUserPosts = async function (query) {
        const cursor = collection.find(processQuery(query));
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    collection.getUserPost = async function (query, throwException = true) {
        const doc = await collection.findOne(processQuery(query));
        if (!doc) {
            if(throwException)
                throw new Error(`${CLN_NAME} not found ${JSON.stringify(query)}`);
            return null;
        }
        return processDoc(doc);
    };
    collection.existsUserPosts = async function (query) {
        return await collection.find(processQuery(query)).limit(1).count() > 0;
    };
    collection.createUserPost = async function (ownerID, title, content, labels=null, location=null) {
        let newDoc = {
            ownerID,
            title,
            content,
        }
        if(labels)
            newDoc.labels = labels;
        if(location)
            newDoc.location = processLocationString(location)

        // UserContentCollection.processForm(docData, content)
        validateDoc(newDoc);
        const {insertedId} = await collection.insertOne(newDoc);
        newDoc = await collection.findOne({_id: insertedId});
        console.log(`Created ${CLN_NAME} entry: `, insertedId, newDoc);
        return processDoc(newDoc);
    };
    collection.deleteUserPosts = async function (query) {
        const {deletedCount} = await collection.deleteMany(processQuery(query));
        console.log(`Deleted ${deletedCount} ${CLN_NAME}${deletedCount === 1 ? '' : 's'}`);
        return deletedCount;
    };

    /** Model **/

    const ContentDocPrototype = {
        getID: function() { return this._id; },
        // getEmail: function() { return this.email; },
        getOwnerID: function() { return this.ownerID+''; },
        getContent: function() { return this.content; },
        getLocation: function() {
            if(!this.data.location)
                return null;
            return new GeoLocation(...this.location.coordinates);
        },
        getTitle: function() { return this.data.title; },

    }


    /** Private Functions **/

    function processQuery(query) {
        if(query._id && !(query._id instanceof ObjectId))
            query._id = new ObjectId(query._id);
        return query;
    }

    function processDoc(doc) {
        Object.setPrototypeOf(doc, ContentDocPrototype);
        return doc;
    }

    function processLocationString(cString) {
        let [lon, lat] = typeof cString === 'string' ? cString.split(/\s*[\s,]\s*/, 2).map(l => parseFloat(l)) : cString;
        const isLatitude = lat => isFinite(lat) && Math.abs(lat) <= 90;
        const isLongitude = lat => isFinite(lat) && Math.abs(lat) <= 180;
        if(!isLatitude)
            throw new Error("Invalid latitude: " + cString);
        if(!isLongitude)
            throw new Error("Invalid longitude: " + cString);
        return {
            type: "Point",
            coordinates: [lon, lat]
        }
    }

    function validateDoc(doc) {
        doc.title = doc.title.toString().replace(/<[^>]*>?/gm, ''); // Strip HTML Tags
        if(doc.labels && !Array.isArray(doc.labels))
            doc.labels = [doc.labels];
    }


    /** Run Tests **/

    collection['$test'] = async function () {
        const {User: userCollection} = collections;
        const email = 'test@wut.com';
        if(!(await userCollection.existsUsers({email})))
            await userCollection.createUser('test@wut.com');
        const testUser = await userCollection.getUser({email})

        let content = await collection.createUserPost(testUser.getID(), 'test content', 'test content', 'test', [90, -100]);
        let results = await collection.queryUserPosts({labels: 'test'});
        expect(results.length).toBeGreaterThanOrEqual(1);
        let deleteCount = await collection.deleteUserPosts({_id:content.getID()})
        expect(deleteCount).toBe(1);
        deleteCount = await userCollection.deleteUsers({_id: testUser.getID()});
        expect(deleteCount).toBe(1);
    }

    return collection;
}