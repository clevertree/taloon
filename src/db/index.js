import UserSchema from "./UserSchema";
import UserFileSchema from "./UserFileSchema";

export async function initiateCollections(db) {
    const collections = {};
    collections.User = await UserSchema(db, collections);
    collections.UserFile = await UserFileSchema(db, collections);
    return collections;
}