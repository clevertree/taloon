import UserFileDoc from "./UserFileDoc";

export default class UserFileDB {
    constructor(db) {
        this.db = db;
    }

    /**
     * Search user file documents
     * @param {object} query
     * @param {string} query.owner The email of the owning user.
     * @param {string} query.path The path of the file.
     * @returns {Promise<UserFileDoc[]>}
     */
    async searchUserFiles(query) {
        const userFileDocs = await new Promise((resolve, reject) => {
            this.db.collection(UserFileDoc.TABLE)
                .find(query)
                .toArray(function(err, result) {
                    err ? reject(err) : resolve(result);
                });
        });
        return userFileDocs.map(userDoc => new UserFileDoc(userDoc));
    }

    /**
     * Check if a user file document exists
     * @param {object} query
     * @param {string} query.owner The email of the owning user.
     * @param {string} query.path The path of the file.
     * @returns {Promise<boolean>}
     */
    async userFileExists(query) {
        const userFileDocs = await this.searchUserFiles(query);
        return userFileDocs.length > 0;
    }


    /**
     * Create a new user file document
     * @param {object} data
     * @param {string} data.owner The email of the owning user.
     * @param {string} data.path The path of the file.
     * @param {string} data.content The file content.
     * @return {UserFileDoc}
     */
    async createUserFile(data) {
        if(await this.userFileExists({
            owner: data.owner,
            path: data.path
        }))
            throw new Error("user file already exists: " + data.path);

        this.db.collection(UserFileDoc.TABLE).insertOne(data);
        console.log(`Created user file: `, data);
        return new UserFileDoc(data);
    }

}
