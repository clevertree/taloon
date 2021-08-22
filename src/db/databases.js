import UserSchema from "./UserSchema";
import ContentSchema from "./ContentSchema";

export default async function initiateCollections(db) {
    const collections = {};
    collections.user = UserSchema(db, collections);
    collections.content = ContentSchema(db, collections);
    return collections;
}