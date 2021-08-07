const { Octokit } = require("@octokit/core");
const { OAuthApp, createNodeMiddleware } = require("@octokit/oauth-app");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var data;
    const code = req.headers.code;

    const state = req.headers.state;

    context.log(code)
    context.log(state)
    const app = new OAuthApp({
        clientType: "oauth-app",
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        defaultScopes: "repo"
    });


    app.on("token.created", async (ccc) => {
        data = await ccc.octokit.request("GET /user");
        context.log(`New token created for ${data.login}`);
    });
    // context.log(app);

    // const { octokit } = await app.getUserOctokit({ code, state });

    // context.log(octokit);

    // await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
    //     owner: "ganning127",
    //     repo: "asdfdas",
    //     issue_number: 1,
    //     body: 'created via serverless'
    // })

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: { data }
    };
}