import UserContentDoc from "./UserContentDoc";
import {JSDOM} from "jsdom";
import {ObjectId} from "mongodb";

export default class UserContentCollection {
    static NAME = 'user_content';
    static async initiateCollection(db) {
        const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(this.NAME);
        let collection = collectionExists ? db.collection(this.NAME) : await db.createCollection(this.NAME);

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
                        actions: {
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
            collMod: this.NAME,
            ...options,
        })
        await collection.createIndex( { ownerID: 1, title: 1 }, { unique: true } );
    }

    constructor(db) {
        this.db = db;
        this.collection = db.collection(this.constructor.NAME);
    }


    /**
     * Search user file documents
     * @param {object} query
     * @param {string} query._id The file GUID.
     * @param {string} query.actions The file actions.
     * @param {string} query.ownerID The email of the owning user.
     * @returns {Promise<UserContentDoc[]>}
     */
    async queryUserFiles(query) {
        if(query._id && !(query._id instanceof ObjectId))
            query._id = new ObjectId(query._id);
        const userFileDocs = await new Promise((resolve, reject) => {
            this.collection
                .find(query)
                .toArray(function(err, result) {
                    err ? reject(err) : resolve(result);
                });
        });
        return userFileDocs.map(userDoc => new UserContentDoc(userDoc));
    }

    /**
     * Search for a single user file document
     * @param {string} _id
     * @param orThrow
     * @returns {Promise<UserContentDoc>}
     */
    async queryUserFile(_id, orThrow=true) {
        const files = await this.queryUserFiles({_id});
        if(files.length === 0 && orThrow)
            throw new Error("User file ID not found: " + _id)
        return files[0] || null;
    }

    /**
     * Create a new user file document
     * @param {ObjectId} ownerID The file owner (userID).
     * @param {string} title The file title.
     * @param {string} content The file content.
     * @return {UserContentDoc}
     */
    async createUserFile(ownerID, title, content) {
        const docData = {
            ownerID,
            title,
            content,
        }
        UserContentCollection.processForm(docData, content)
        const {insertedId} = await this.collection.insertOne(docData);
        docData._id = insertedId;
        console.log(`Created user file: `, insertedId);
        return new UserContentDoc(docData);
    }

    static processForm(docData, markdownHTML) {
        const DOM = new JSDOM(markdownHTML);
        const document = DOM.window.document;

        const form = document.querySelectorAll('form');
        if(form) {
            docData.action = form.getAttribute('action');
            if(form.elements.location)
                docData.location = processCoordinateString(form.elements.location.value)
            if(form.elements.keywords)
                docData.keywords = processKeywords(form.elements.keywords.value)
        }
    }
}

function processCoordinateString(cString) {
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

function processKeywords(keywords) {
    return keywords.split(/\s*[\s,]\s*/).map(keyword => stripHTML(keyword));
}

function stripHTML(text) {
    return text.toString().replace(/<[^>]*>?/gm, '');
}