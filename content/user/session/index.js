export default async function UserSessionIndex(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;

    if(req.method.toLowerCase() !== 'post') {
        /** Get Request **/
        const markdownPage = await server.getContentFile(`${PATH_ASSETS}/index.view.md`);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(markdownPage);

    } else {
        /** Post Request **/
        const userClient = server.getUserSession(req.session);
        res.send({
            isActive: userClient.isActive(),
            email: userClient.getEmail() || null
        });
    }

}

