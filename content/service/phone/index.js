const {CONTENT_LABEL} = require('./phone.config.json')
export default async function ServicePhoneIndex(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;
    // const userSession = server.getUserSession(req.session);
    const {UserFile: userFileCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const {title, location, distance} = req.body;
            const searchValues = {title, location, distance, labels: CONTENT_LABEL};
            const userFileDocs = await userFileCollection.queryUserFiles(searchValues);
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
