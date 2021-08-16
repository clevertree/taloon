const REQUEST_URL = require('./request.js').REQUEST_URL;
module.exports = async function ServicePhoneIndex(req, res, server, routePath) {
    // const userSession = server.getUserSession(req.session);

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const userContentCollection = server.getUserContentCollection();
            const userFileDocs = await userContentCollection.queryUserFiles({});

            const safeValues = {
                results: processResults(userFileDocs)
            }
            const markdownPage = server.getContentFile(`${__dirname}/index.view.md`, {}, safeValues);
            res.send(markdownPage);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            // const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';

            // Check if form submission is a preview
            // if(isPreview)
            //     return res.status(202).send(response);

            // Validate form and redirect
            const {search, location, distance} = req.body;
            const values = {search, location, distance};
            const redirectURL = req.path + '?' + Object.keys(values).map(key => `${key}=${encodeURIComponent(values[key])}`).join('&');
            events.push(['redirect', redirectURL, 1])
            res.send(response);
            break;
    }
}


function processResults(userFileDocs) {
    return `
<table>
<thead>
<th><td>Title</td><td>Location</td></th>
</thead>
<tbody>
${userFileDocs.map(userFileDoc => `<tr><td>${userFileDoc.getTitle()}</td><td>${userFileDoc.getLocation()}</td></tr>`).join('')}
</tbody>
</table>
`
}