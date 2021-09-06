// const {CONTENT_LABEL} = require('./image.config.json')
export default async function ServicePhoneIndex(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;
    // const userSession = server.getUserSession(req.session);
    const {UserPost: userPostCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const {title, location, distance} = req.body;
            const searchValues = {title, location, distance};
            const userFileDocs = await userPostCollection.queryUserPosts(searchValues);
            // TODO: partial text & location searches

            const safeValues = {
                results: processResults(userFileDocs)
            }
            const markdownPage = await server.getContentFile(`${PATH_ASSETS}/index.view.md`, {}, safeValues);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(markdownPage);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            // Redirect with updated search parameters
            const redirectURL = req.path + '?' + Object.keys(req.body).map(key => `${key}=${encodeURIComponent(req.body[key])}`).join('&');
            events.push(['redirect', redirectURL, 1]); // TODO: prevent adding to history
            res.send(response);
            break;
    }
}

/** Process Search Results into HTML **/
export function processResults(userFileDocs) {
    return `
<table class="search-results">
  <thead>
    <tr>
      <th>Title</th>
      <th>Owner</th>
    </tr>
  </thead>
  <tbody>${userFileDocs.map(userFileDoc => `
    <tr>
      <td><a href="request.js?_id=${userFileDoc.getID()}">${userFileDoc.getTitle()}</a></td>
      <td><a href="${process.env.REACT_APP_SERVICE_SESSION}?view=user&_id=${userFileDoc.getOwnerID()}">${userFileDoc.getOwner().getTitle()}</a></td>
    </tr>`
    ).join('')}
  </tbody>
</table>
`
}


/** Unit Tests **/
export async function $test(agent, server, routePath) {
    await agent
        .post(routePath)
        .send({name: 'john'})
        .set('Accept', 'application/json')
        .expect(isJSONError)
        .expect('Content-Type', /json/)
        .expect(200)
    await agent
        .get(routePath)
        .expect(200)
        .expect('Content-Type', /markdown/)
    function isJSONError(res) {
        if(!res.type.includes('json') || res.status !== 200)
            throw new Error(`${routePath}: ${res.text}`);
    }
}


export async function ServicePhonePost(req, res, server) {
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
