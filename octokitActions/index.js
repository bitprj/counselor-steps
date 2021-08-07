const { Octokit } = require("@octokit/core");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const code = req.headers.code;
    const state = req.headers.state;

    const app = new OAuthApp({
        clientType: "oauth-app",
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        defaultScopes: "repo"
    });

    const { octokit } = await app.getUserOctokit({ code: code });


    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner,
        repo,
        issue_number: "1",
        body: 'created via serverless'
    })

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: "success"
    };
}