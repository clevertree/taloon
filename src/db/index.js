import UserSchema from "./UserSchema";
import ContentSchema from "./ContentSchema";

export async function initiateCollections(db) {
    const collections = {};
    collections.user = await UserSchema(db, collections);
    collections.content = await ContentSchema(db, collections);
    return collections;
}