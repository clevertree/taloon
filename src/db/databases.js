import UserSchema from "./user/UserSchema";
import ContentSchema from "./file/ContentSchema";

export default async function initiateCollections(db) {
    const collections = {};
    collections.user = UserSchema(db, collections);
    collections.content = ContentSchema(db, collections);
    return collections;
}