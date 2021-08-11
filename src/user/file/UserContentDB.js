import UserContentDoc from "./UserContentDoc";
import {JSDOM} from "jsdom";

export default class UserContentDB {
    static TABLE = 'user_content';

    constructor(db) {
        this.db = db;
        this.collection = null;
    }

    async getCollection() {
        if(this.collection)
            return this.collection;
        const validator = {
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
        };
        const collectionExists = (await this.db.listCollections().toArray()).map(c => c.name).includes(UserContentDB.TABLE);
        if(collectionExists) {
            await this.db.command({
                collMod: UserContentDB.TABLE,
                validator,
                validationLevel: "moderate",
                validationAction: "error"
            })
        } else {
            await this.db.createCollection(UserContentDB.TABLE, {
                validator
            })
        }

        //
        this.collection = this.db.collection(UserContentDB.TABLE);
        await this.collection.createIndex( { ownerID: 1, title: 1 }, { unique: true } );
        return this.collection;
    }

    /**
     * Search user file documents
     * @param {object} query
     * @param {string} query.actions The file actions.
     * @param {string} query.owner The email of the owning user.
     * @returns {Promise<UserContentDoc[]>}
     */
    async searchUserFiles(query) {
        const collection = await this.getCollection();
        const userFileDocs = await new Promise((resolve, reject) => {
            collection
                .find(query)
                .toArray(function(err, result) {
                    err ? reject(err) : resolve(result);
                });
        });
        return userFileDocs.map(userDoc => new UserContentDoc(userDoc));
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
        UserContentDB.processFormActions(docData, content)
        const collection = await this.getCollection();
        const {insertedId} = await collection.insertOne(docData);
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
