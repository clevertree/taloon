import UserSchema from "./UserSchema";
import UserPostSchema from "./UserPostSchema";

export async function initiateCollections(db) {
    const collections = {};
    collections.User = await UserSchema(db, collections);
    collections.UserPost = await UserPostSchema(db, collections);
    return collections;
}