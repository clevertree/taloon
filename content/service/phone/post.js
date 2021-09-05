import {CONTENT_LABEL} from "./phone.config.json";

export default async function ServicePhonePost(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;
    const PATH_INDEX = `${PATH_BASE}/index.js`;
    // const userSession = server.getUserSession(req.session);
    // const {user: userCollection, content: contentCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const markdownPage = await server.getContentFile(`${PATH_ASSETS}/post.view.md`);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(markdownPage);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
            const userSession = server.getUserSession(req.session);
            // const {form, handleFormSubmission} = server.getFormHandler(req);



            if (userSession.isActive()) {
                // const localUser = await userSession.getOrCreateUser();
                const user = await userSession.getOrCreateUser();
                if(await user.hasFile(req.body.title))
                    validations.title = "This title is already in use. Please try another"

            }

            // Check if form submission is a preview
            if(isPreview) {
                res.status(202);

            } else {
                // Check for active session
                if (!userSession.isActive()) {
                    // Session is required
                    validations.email = "Please Log in to become a phone sponsor.";
                }
                if(!req.body.title)
                    validations.title = "Title is required";

                // Handle Form Validation
                if(Object.values(validations).length > 0) {
                    res.status(400);
                    response.message = Object.values(validations).join("\n");

                } else {
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
                    events.push(['redirect', `${PATH_INDEX}?_id=${userFileDoc.getID()}`, 4000]);
                }
            }
            return res.send(response);
    }
}

/** Unit Tests **/
export async function $test(agent, server, routePath) {
    const {User:userCollection, UserPost: userPostCollection} = server.getCollections();
    /** Test Login POST Request **/
    const email = 'test@wut.ohok';
    const title = '$ Unit Test Post';

    // Delete existing user posts
    // const user = await userCollection.getUser({email});
    userPostCollection.deleteUserPosts({title})

    let res = await agent
        .post(process.env.REACT_APP_PATH_USER_LOGIN)
        .send({service: 'email', email})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)
    const {code2Factor} = res.body;

    /** Test Login 2Factor POST Request **/
    res = await agent
        .post(process.env.REACT_APP_PATH_USER_LOGIN)
        .send({service: 'email-2factor-response', code: code2Factor, email})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)

    // console.log("Login Response: ", res.text);

    /** Test GET Request **/
    res = await agent
        .get(routePath)
        .expect(200)
        .expect('Content-Type', /markdown/)


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
