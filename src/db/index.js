import UserSchema from "./UserSchema";
import UserPostSchema from "./UserPostSchema";
import UserImageSchema from "./UserImageSchema";

export async function initiateCollections(db) {
    const collections = {};
    collections.User = await UserSchema(db, collections);
    collections.UserPost = await UserPostSchema(db, collections);
    collections.UserImage = await UserImageSchema(db, collections);
    return collections;
}