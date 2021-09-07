import {GridFSBucket, ObjectId} from "mongodb";
import fs from "fs";
import {Readable} from "stream";
import {createTestUser} from "./UserSchema";

export default async function UserFileSchema(db, collections) {
    const CLN_NAME = 'UserFile';
    // const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(CLN_NAME);
    // let collection = collectionExists ? db.collection(CLN_NAME) : await db.createCollection(CLN_NAME);

    const fsBucket = new GridFSBucket(db, {
        chunkSizeBytes: 1024,
        bucketName: CLN_NAME
    });

    const dbChunks = db.collection(CLN_NAME + '.chunks');
    const collection = db.collection(CLN_NAME + '.files');

    /** Helper methods **/
    collection.queryUserFiles = async function (query, limit=20) {
        const newQuery = processSearch(query, limit);
        const cursor = collection.aggregate(newQuery);
        // const cursor = fsBucket.find(processQuery(query, {limit}))
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    collection.getUserFile = async function (query, throwException = true) {
        const docList = await collection.queryUserFiles(query, 1);
        if (docList.length === 0) {
            if(throwException)
                throw new Error(`${CLN_NAME} not found ${JSON.stringify(query)}`);
            return null;
        }
        return docList[0];
    };
    collection.existsUserFiles = async function (query) {
        return await collection.find(processQuery(query)).limit(1).count() > 0;
    };

    collection.createUserFile = async function (ownerID, filename, stream, metadata={}) {
        const {User: userCollection} = collections;
        await userCollection.getUserByID(ownerID);
        metadata.ownerID = ownerID;
        validateMetadata(metadata);
        if(typeof stream === "string")
            stream = stringToStream(stream);
        if(stream instanceof Buffer)
            stream = Readable.from(stream);
        // const stream = Readable.from(myBuffer.toString());

        const {_id:insertedId} = await new Promise((resolve, reject) => {
            stream
                .pipe(fsBucket.openUploadStream(filename, {
                    metadata
                }))
                .on('error', reject)
                .on('finish', resolve);
        });


        // UserContentCollection.processForm(docData, content)
        // const {insertedId} = await collection.insertOne(metadata);
        const userFileDoc = await collection.getUserFile({_id: insertedId});
        console.log(`Inserted ${CLN_NAME} file: `, userFileDoc);
        return userFileDoc;
        // return processDoc(metadata);
    };

    collection.deleteUserFileByID = async function (_id) { return await collection.deleteUserFiles({_id}); }
    collection.deleteUserFiles = async function (query) {
        const result = await collection.deleteMany(processQuery(query));
        // const {deletedCount} = await collection.deleteMany(processQuery(query));
        console.log(`Deleted ${result.deletedCount} ${CLN_NAME}${result.deletedCount === 1 ? '' : 's'}`);
        return result;
    };

    /** Model **/

    const UserFilePrototype = {
        getID: function() { return this._id; },
        // getEmail: function() { return this.email; },
        getFileName: function() { return this.filename; },
        getLength: function() { return this.length; },
        getUploadDate: function() { return this.uploadDate; },
        getMetaData: function() { return this.metadata; },
        getOwner: function() { return this.owner; },
        getOwnerID: function() { return this.metadata.ownerID; },
        getLabels: function() { return this.metadata.labels || []; },
        pipeStream: async function(res) {
            await new Promise((resolve, reject) => {
                fsBucket.openDownloadStream(this.getID())
                    .on('error', reject)
                    .on('end', resolve)
                    .pipe(res)

            });
        },
        getSrc: function() { return process.env.REACT_APP_SERVICE_IMAGE + '?_id=' + this.getID(); },
        getFileExtension: function() { return this.filename.split('.').pop().toLowerCase(); },
        renderHTMLTag: function() {
            switch(this.getFileExtension()) {
                case 'png':
                case 'bmp':
                case 'jpeg':
                case 'jpg':
                    return `<img alt="${this.getFileName()}" src="${this.getSrc()}" />`;
                case 'md':
                    return `<markdown alt="${this.getFileName()}" src="${this.getSrc()}" />`;
                default:
                    return `<file alt="${this.getFileName()}" src="${this.getSrc()}" />`;
            }
        },
        getContentType: function() {
            switch(this.getFileExtension()) {
                case 'png': return 'image/png';
                case 'bmp': return 'image/bmp';
                case 'jpeg': return 'image/jpeg';
                case 'jpg': return 'image/jpg';
                case 'md': return 'text/markdown';
                default: return 'text/plain';
            }

        }
    }
    collection.DocumentPrototype = UserFilePrototype;


    /** Private Functions **/

    function processQuery(query) {
        const newQuery = Object.assign({}, query);
        Object.keys(newQuery).forEach(key => newQuery[key] === undefined && delete newQuery[key])
        if(newQuery._id && !(newQuery._id instanceof ObjectId))
            newQuery._id = new ObjectId(newQuery._id);
        if(newQuery.ownerID) {
            newQuery['metadata.ownerID'] = newQuery.ownerID instanceof ObjectId ? newQuery.ownerID : new ObjectId(newQuery.ownerID);
            delete newQuery.ownerID;
        }
        if(newQuery.labels) {
            newQuery['metadata.labels'] = newQuery.labels;
            delete newQuery.labels;
        }
        return newQuery;
    }


    function processSearch(query, limit=20) {
        const newQuery = processQuery(query);
        return [
            { "$match": newQuery},
            // { "$sort": { "date": -1 } },
            { "$limit": limit },
            { "$lookup": {
                    "localField": "metadata.ownerID",
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
        Object.setPrototypeOf(doc, UserFilePrototype);
        if(doc.owner)
            Object.setPrototypeOf(doc.owner, collections.User.DocumentPrototype)
        return doc;
    }

    function validateMetadata(metadata) {
        // metadata.title = metadata.title.toString().replace(/<[^>]*>?/gm, ''); // Strip HTML Tags
        if(metadata.labels && !Array.isArray(metadata.labels))
            metadata.labels = [metadata.labels];
    }


    /** Run Tests **/

    collection['$test'] = async function () {
        const testUser = await createTestUser(collections.User);

        const fsStream = fs.createReadStream('./package.json')
        const testFile = await collection.createUserFile(testUser.getID(), 'package.json', fsStream, {
            labels: 'unit-test'
        });
        // await testFile.pipeStream(process.stdout);
        // await collection.deleteUserFiles({title})
        // let contentDoc = await collection.createUserFile(testUser.getID(), title, content, 'test', [90, -100]);
        let results = await collection.queryUserFiles({labels: 'unit-test'});
        expect(results.length).toBeGreaterThanOrEqual(1);
        let deleteResult = await collection.deleteUserFileByID(testFile.getID())
        expect(deleteResult.deletedCount).toBe(1);
        deleteResult = await testUser.delete();
        // deletedCount = await userCollection.deleteUsers({_id: testUser.getID()});
        expect(deleteResult.deletedCount).toBe(1);
    }

    return collection;
}

function stringToStream(str) {
    const stream = new Readable();
    stream.push(str);
    stream.push(null); // EOF
    return stream;
}

