import {ObjectId} from "mongodb";
import GeoLocation from "../components/location/GeoLocation";

export default async function UserSchema(db) {
    const CLN_NAME = 'content';
    const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(CLN_NAME);
    let collection = collectionExists ? db.collection(CLN_NAME) : await db.createCollection(CLN_NAME);

    // Create Collection SCHEMA
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

    collection.queryContent = async function (query) {
        const cursor = collection.find(processQuery(query));
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    collection.getContent = async function (query, throwException = true) {
        const doc = await collection.findOne(processQuery(query));
        if (!doc) {
            if(throwException)
                throw new Error("Content not found " + JSON.stringify(query));
            return null;
        }
        return processDoc(doc);
    };
    collection.contentExists = async function (query) {
        return await collection.find(processQuery(query)).limit(1).count() > 0;
    };
    collection.createContent = async function (ownerID, title, content, labels=null, location=null) {
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
        newDoc = collection.queryOne({_id: insertedId});
        console.log(`Created user file: `, insertedId, newDoc);
        return newDoc;
    };

    /** Model **/

    const ContentDocPrototype = {
        getIDString: function() { return this._id+''; },
        getEmail: function() { return this.email; },
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
        let [lon, lat] = cString.split(/\s*[\s,]\s*/, 2).map(l => parseFloat(l));
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
        for(const key in doc) {
            if(doc.hasOwnProperty(key)) {
                switch(key) {
                    case 'content': break;
                    default:
                        doc[key] = stripHTML(doc[key]);
                }
            }
        }
    }

    function stripHTML(text) {
        return text.toString().replace(/<[^>]*>?/gm, '');
    }


    // Run Tests
    // const newUser = await collection.createUser('omfg@wut.com');
    // const users = await collection.queryAll({});

    return collection;
}