import fs from "fs";
import path from "path";
import UserContentCollection from "../../user/file/UserContentCollection";

export default class ContentManager {
    async loadContent(db, contentURL) {
        let split = contentURL.split(':');
        switch (split[0].toLowerCase()) {
            case 'file':
                let [, contentPath] = split;
                contentPath = path.join(process.env.REACT_APP_PATH_CONTENT, contentPath);
                if (!fs.existsSync(contentPath))
                    throw new Error("Content page not found: " + contentPath);

                return fs.readFileSync(contentPath, 'utf8');
            case 'db':
                let [, contentID] = split;
                await new UserContentCollection(db).queryUserFile({
                    _id: contentID
                })
        }

    }
}