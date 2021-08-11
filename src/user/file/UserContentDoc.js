export default class UserContentDoc {
    constructor(data={}) {
        this.data = data;
    }

    getID() { return this.data._id; }
    getOwnerID() { return this.data.owner; }
    getKeywords() { return this.data.keywords; }
    getActions() { return this.data.actions || []; }
    getContent() { return this.data.content || []; }

}
