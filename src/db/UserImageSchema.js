import {GridFSBucket, ObjectId} from "mongodb";
import fs from "fs";
import {createTestUser} from "./UserSchema";

export default async function UserImageSchema(db, collections) {
    const CLN_NAME = 'UserImage';
    // const collectionExists = (await db.listCollections().toArray()).map(c => c.name).includes(CLN_NAME);
    // let collection = collectionExists ? db.collection(CLN_NAME) : await db.createCollection(CLN_NAME);
    const dbChunks = db.collection(CLN_NAME + '.chunks');
    const collection = db.collection(CLN_NAME + '.files');

    const fsBucket = new GridFSBucket(db, {
        chunkSizeBytes: 1024,
        bucketName: CLN_NAME
    });


    // fs.createReadStream('./package.json')
    //     .pipe(collection.openUploadStream('package.json', {
    //         metadata: {wut: 'ohok'}
    //     }))
    //     .on('error', function(error) {
    //         throw error;
    //     }).on('finish', function() {
    //         console.log('done!');
    //         process.exit(0);
    //     });

    /** Helper methods **/
    fsBucket.queryUserImages = async function (query, limit=20) {
        const newQuery = processSearch(query, limit);
        const cursor = collection.aggregate(newQuery);
        // const cursor = fsBucket.find(processQuery(query, {limit}))
        const docList = await cursor.toArray();
        return docList.map(processDoc);
    };
    fsBucket.getUserImage = async function (query, throwException = true) {
        const docList = await fsBucket.queryUserImages(query, 1);
        if (docList.length === 0) {
            if(throwException)
                throw new Error(`${CLN_NAME} not found ${JSON.stringify(query)}`);
            return null;
        }
        return docList[0];
    };
    // collection.existsUserImages = async function (query) {
    //     return await collection.find(processQuery(query)).limit(1).count() > 0;
    // };

    fsBucket.createUserImage = async function (ownerID, filename, stream, labels=null, metadata={}) {
        const {User: userCollection} = collections;
        await userCollection.getUserByID(ownerID);
        metadata.ownerID = ownerID;
        if(labels)
            metadata.labels = labels;
        validateMetadata(metadata);

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
        const userImageDoc = await fsBucket.getUserImage({_id: insertedId});
        console.log(`Inserted ${CLN_NAME} file: `, userImageDoc);
        return userImageDoc;
        // return processDoc(metadata);
    };

    fsBucket.deleteUserImageByID = async function (id) {
        await dbChunks.deleteMany({files_id:id});
        const {deletedCount} = await collection.deleteOne({_id:id});
        // const {deletedCount} = await collection.deleteMany(processQuery(query));
        console.log(`Deleted ${deletedCount} ${CLN_NAME}${deletedCount === 1 ? '' : 's'}`);
        return deletedCount;
    };

    /** Model **/

    const UserImagePrototype = {
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
        }
    }
    fsBucket.DocumentPrototype = UserImagePrototype;


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
        Object.setPrototypeOf(doc, UserImagePrototype);
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

    fsBucket['$test'] = async function () {
        const testUser = await createTestUser(collections.User);

        const fsStream = fs.createReadStream('./package.json')
        const testImage = await fsBucket.createUserImage(testUser.getID(), 'package.json', fsStream, 'unit-test');
        // await testImage.pipeStream(process.stdout);
        // await collection.deleteUserImages({title})
        // let contentDoc = await collection.createUserImage(testUser.getID(), title, content, 'test', [90, -100]);
        let results = await fsBucket.queryUserImages({labels: 'unit-test'});
        expect(results.length).toBeGreaterThanOrEqual(1);
        let deleteCount = await fsBucket.deleteUserImageByID(testImage.getID())
        expect(deleteCount).toBe(1);
        deleteCount = await testUser.delete();
        // deleteCount = await userCollection.deleteUsers({_id: testUser.getID()});
        expect(deleteCount).toBe(1);
    }

    return fsBucket;
}