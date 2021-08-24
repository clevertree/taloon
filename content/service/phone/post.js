import SiteConfig from "../../config.json";
import {CONTENT_LABEL} from "./phone.config.json";
import path from "path";

export default async function ServicePhonePost(req, res, server, routePath) {
    const PATH_ASSETS = path.join(path.dirname(routePath), 'assets');
    // const userSession = server.getUserSession(req.session);
    // const {user: userCollection, content: contentCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const markdownPage = server.getContentFile(`${PATH_ASSETS}/post.view.md`);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(markdownPage);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
            const userSession = server.getUserSession(req.session);
            // const {form, handleFormSubmission} = server.getFormHandler(req);

            // Handle Form Validations
            // validations.title = "Please Register or Log in to become a phone sponsor.";

            // Check for active session
            if (userSession.isActive()) {
                // const localUser = await userSession.getOrCreateUser();
                const user = await userSession.getOrCreateUser();
                if(await user.hasFile(req.body.title))
                    validations.title = "This title is already in use. Please try another"

            } else {
                // Email field may need to be set enabled and required
                validations.email = "Please Register or Log in to become a phone sponsor.";
            }
            if(!req.body.title)
                validations.title = "Title is required";

            // Check if form submission is a preview
            if(isPreview)
                return res.status(202).send(response);
            // Check if any validations exist
            if(Object.values(validations).length > 0)
                return res.status(400).send({message: "Form Validation Failed", ...response});


            // Perform Action
            const user = await userSession.getOrCreateUser();
            const userFileDoc = await user.createFileFromTemplate(`${PATH_ASSETS}/request.template.md`,
                req.body.title,
                req.body,
                [CONTENT_LABEL],
                req.body.location
                );

            // Send Response
            response.message = "New post has been created successfully";
            const indexURL = routePath.replace('/post.js', '/index.js');
            events.push(['redirect', `${indexURL}?_id=${userFileDoc.getID()}`, 4000]);
            return res.send(response);
    }
}

/** Unit Tests **/
export async function $test(agent, server, routePath) {
    /** Test Login POST Request **/
    const {PATH_LOGIN} = SiteConfig;
    const email = 'test@wut.ohok';
    const title = 'Test Post';
    let res = await agent
        .post(PATH_LOGIN)
        .send({service: 'email', email})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)
    const {code2Factor} = res.body;

    /** Test Login 2Factor POST Request **/
    res = await agent
        .post(PATH_LOGIN)
        .send({service: 'email-2factor-response', code: code2Factor, email})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)


    /** Test GET Request **/
    res = await agent
        .get(routePath)
        .expect(200)
        .expect('Content-Type', /markdown/)

    // Delete existing user posts
    const {User:userCollection, UserPost: userPostCollection} = server.getCollections();
    const user = await userCollection.getUser({email});
    userPostCollection.deleteUserPosts({ownerID: user.getID()})

    /** Test POST Request **/
    res = await agent
        .post(routePath)
        .send({title})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)

    res = await agent
        .post(routePath)
        .send({title})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect('Content-Type', /json/)
        .expect(400)

    function isJSONError(res) {
        if(!res.type.includes('json') || res.status !== 200)
            throw new Error(`${routePath}: ${res.text}`);
    }
}
