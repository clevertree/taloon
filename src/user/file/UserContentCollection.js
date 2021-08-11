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
     * @param {string} query.actions The file actions.
     * @param {string} query.owner The email of the owning user.
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
     * @param {object} query
     * @param orThrow
     * @param {string} query.actions The file actions.
     * @param {string} query.owner The email of the owning user.
     * @returns {Promise<UserContentDoc>}
     */
    async queryUserFile(query, orThrow=true) {
        const files = await this.queryUserFiles(query);
        if(files.length === 0 && orThrow)
            throw new Error("User file not found: " + JSON.stringify(query))
        if(files.length > 1 && orThrow)
            throw new Error("Multiple user files found: " + JSON.stringify(query))
        return files[0] || null;
    }

    /**
     * Create a new user file document
     * @param {ObjectId} ownerID The file owner (userID).
     * @param {string} title The file title.
     * @param {string} content The file content.
     * @param {string[]} keywords Keywords
     * @return {UserContentDoc}
     */
    async createUserFile(ownerID, title, content, keywords=[]) {
        const docData = {
            ownerID,
            title,
            content,
            keywords,
        }
        UserContentCollection.processFormActions(docData, content)
        const {insertedId} = await this.collection.insertOne(docData);
        docData._id = insertedId;
        console.log(`Created user file: `, insertedId);
        return new UserContentDoc(docData);
    }

    static processFormActions(docData, markdownHTML) {
        const DOM = new JSDOM(markdownHTML);
        const document = DOM.window.document;

        const forms = [...document.querySelectorAll('form')];
        docData.actions = forms.map(form => form.getAttribute('action'));
    }
}
