export default class UserFileDoc {
    static TABLE = 'user_file';
    constructor(data={}) {
        this.data = data;
    }

    getOwnerEmail() { return this.data.owner; }
    getPath() { return this.data.path; }
    getContent() { return this.data.content; }

}
