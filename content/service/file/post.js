export default async function ServiceFile(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const markdownPage = await server.getContentFile(`${PATH_ASSETS}/post.view.md`);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(markdownPage);
            break;

    }
}


/** Unit Tests **/
export async function $test(agent, server, routePath) {
    // await agent
    //     .get(routePath)
    //     .expect(200)
    //     .expect('Content-Type', /markdown/)
}

