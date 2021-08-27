const {CONTENT_LABEL} = require('./phone.config.json')
export default async function ServicePhoneIndex(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;
    // const userSession = server.getUserSession(req.session);
    const {UserPost: userPostCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const {title, location, distance} = req.body;
            const searchValues = {title, location, distance, labels: CONTENT_LABEL};
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
// TODO: send <results>JSON</results>
export function processResults(userFileDocs) {
    return `<results>${JSON.stringify(userFileDocs)}</results>`;
//     return `
// <table>
//   <thead>
//     <tr>
//       <th>Title</th>
//       <th>Location</th>
//     </tr>
//   </thead>
//   <tbody>${userFileDocs.map(userFileDoc => `
//     <tr>
//       <td>${userFileDoc.getTitle()}</td>
//       <td>${userFileDoc.getLocation()}</td>
//     </tr>`
//     ).join('')}
//   </tbody>
// </table>
// `
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
