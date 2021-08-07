const { OAuthApp } = require("@octokit/oauth-app");
const fetch = require("node-fetch");
const yaml = require('js-yaml');


module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
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

    context.log(app);

    const octokit = await app.getUserOctokit({ code, state });

    context.log(octokit);

    // OCTOKIT HAS NOW BEEN CREATED

    const { data } = await octokit.request("GET /user");

    const user = data.login;

    const { owner, repo, step } = await queryHasura(user)

    const configyml = await yamlFile(repo, owner, octokit); // get config yaml file
    // console.log(configyml)


    const issues = await octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo,
    })

    await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: "ganning127",
        repo: "asdfdas",
        issue_number: 3,
        state: "closed"
    })


    // console.log(issues)
    for (var i = 0; i < issues.data.length; i++) {
        const issueNo = issues.data[i].number;
        console.log(issueNo)

        await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner,
            repo,
            issue_number: issueNo,
            body: 'closed via oauth'
        })

        await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
            owner,
            repo,
            issue_number: issueNo,
            state: "closed"
        })
    }


    // create the issue
    for (y = 0; y < configyml.steps[step - 1].actions.length; y++) {
        var array = configyml.steps[step - 1].actions[y]
        console.log(array)
        if (array.type == "createIssue") {
            let responseFile = array.body
            const response = await getFileContent(octokit, `.bit/responses/${responseFile}`, owner, repo)
            const issueBody = {
                owner,
                repo,
                title: array.title,
                body: parseTable(response[1]),
            }
            await octokit.request('POST /repos/{owner}/{repo}/issues', issueBody);
        }
    }

    updateHasura(repo, owner, step);


    context.res = {
        // status: 200, /* Defaults to 200 */
        body: { data }
    };
}



async function queryHasura(user) {
    const queryString = `query MyQuery {
      users_users_skip_step(where: {username: {_eq: "${user}"}}, order_by: {updated_at: desc}) {
        step
        repo
        username
      }
    }
    `

    const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;
    const secret = process.env.HASURA_ADMIN_SECRET;

    const data = await fetch(HASURA_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': secret,
        },
        body: JSON.stringify({ query: queryString })
    });
    const responseData = await data.json();

    let owner = responseData.data.users_users_skip_step[0].username
    let repo = responseData.data.users_users_skip_step[0].repo
    let step = responseData.data.users_users_skip_step[0].step

    return { owner, repo, step }
}

const getFileContent = async (octokit, content, owner, repo) => {
    file = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: content
    });
    body = Buffer.from(file.data.content, 'base64').toString()
    return [file, body];
}



const yamlFile = async (repo, owner, octokit) => {
    // works fine
    try {
        console.log("trying to get yaml")

        var yamlfile = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: ".bit/config.yml",
        })


        console.log("we got the yaml")
        // console.log(yamlfile)
    } catch (e) {
        console.log("Error with getting content of yaml");
        console.log(e)
        return null
    }
    console.log("got yaml, but no content yet");
    yamlfile = Buffer.from(yamlfile.data.content, 'base64').toString()
    configyml = yaml.load(yamlfile);

    console.log("returining configyml")
    return configyml;
}

const parseTable = (markdown) => {
    let labContent = ""
    try {
        labContent = markdown.split('---\n')

        if (labContent[2] == null) {
            if (markdown.split('---\r\n')[2] != null) {
                newContent = markdown.split('---\r\n')
                newContent.splice(0, 2);
                newContent = newContent.join('---\n')
                labContent = newContent.toString()
            } else {
                labContent = markdown
            }
        } else {
            labContent.splice(0, 2);
            labContent = labContent.join('---\n')
            labContent = labContent.toString()
        }
    } catch (e) {
        labContent = markdown
    }

    return labContent
}

async function updateHasura(repo, owner, step) {
    // updates the count in hasura to match the count the user wanted
    const endpoint = "https://hasuraprogressupdate.azurewebsites.net/api/hasuraProgressUpdate?code=tn0G0rF59YWk5toQrYS8zw1s8B8RkiPyF6eOlzv1tIXE8NM1g6ljPQ==";
    const options = {
        headers: {
            repo,
            owner,
            step: step
        }
    }

    await fetch(endpoint, options)
    return "updated"
}