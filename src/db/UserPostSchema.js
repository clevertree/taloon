import {ObjectId} from "mongodb";
import GeoLocation from "../client/location/GeoLocation";
import {createTestUser} from "./UserSchema";

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
    collection.queryUserPosts = async function (query, limit=20) {
        // const cursor = collection.find(processQuery(query));
        const cursor = collection.aggregate(processSearch(query, limit))
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    collection.getUserPost = async function (query, throwException = true) {
        const docList = await collection.queryUserPosts(query, 1);
        if (docList.length === 0) {
            if(throwException)
                throw new Error(`${CLN_NAME} not found ${JSON.stringify(query)}`);
            return null;
        }
        return docList[0];
    };
    collection.existsUserPosts = async function (query) {
        return await collection.find(processQuery(query)).limit(1).count() > 0;
    };
    collection.createUserPost = async function (ownerID, title, content, labels=null, location=null) {
        const {User: userCollection} = collections;
        await userCollection.getUserByID(ownerID);

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

    const UserPostPrototype = {
        getID: function() { return this._id; },
        // getEmail: function() { return this.email; },
        getTitle: function() { return this.title; },
        getOwner: function() { return this.owner; },
        getOwnerID: function() { return this.ownerID; },
        getContent: function() { return this.content; },
        getLocation: function() {
            if(!this.data.location)
                return null;
            return new GeoLocation(...this.location.coordinates);
        },
    }
    collection.DocumentPrototype = UserPostPrototype;


    /** Private Functions **/

    function processQuery(query) {
        const newQuery = Object.assign({}, query);
        Object.keys(newQuery).forEach(key => newQuery[key] === undefined && delete newQuery[key])
        if(newQuery._id && !(newQuery._id instanceof ObjectId))
            newQuery._id = new ObjectId(newQuery._id);
        if(query.ownerID && !(query.ownerID instanceof ObjectId))
            query.ownerID = new ObjectId(query.ownerID);
        return newQuery;
    }

    function processSearch(query, limit=20) {
        const newQuery = processQuery(query);
        return [
            { "$match": newQuery},
            // { "$sort": { "date": -1 } },
            { "$limit": limit },
            { "$lookup": {
                    "localField": "ownerID",
                    "from": "User",
                    "foreignField": "_id",
                    "as": "owner"
                } },
            { "$unwind": "$owner" },
            // { "$project": {
            //         "text": 1,
            //         "date": 1,
            //         "userinfo.name": 1,
            //         "userinfo.country": 1
            //     } }
        ]
    }

    function processDoc(doc) {
        Object.setPrototypeOf(doc, UserPostPrototype);
        if(doc.owner)
            Object.setPrototypeOf(doc.owner, collections.User.DocumentPrototype)
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
        const title = 'Unit Test Title';
        const content = 'Unit Test Content';
        const testUser = await createTestUser(collections.User);

        await collection.deleteUserPosts({title})
        let contentDoc = await collection.createUserPost(testUser.getID(), title, content, 'test', [90, -100]);
        let results = await collection.queryUserPosts({labels: 'test'});
        expect(results.length).toBeGreaterThanOrEqual(1);
        let deleteCount = await collection.deleteUserPosts({_id:contentDoc.getID()})
        expect(deleteCount).toBe(1);
        deleteCount = await testUser.delete();
        expect(deleteCount).toBe(1);
    }

    return collection;
}
