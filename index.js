const yaml = require('js-yaml');
const fetch = require('node-fetch')
const { OAuthApp, createNodeMiddleware } = require("@octokit/oauth-app");
var { Server } = require("node-static");


const { createAppAuth } = require("@octokit/auth-app");
const { Octokit, App, Action } = require("octokit");

const app = new OAuthApp({
  clientType: "oauth-app",
  clientId: process.env.GITHUB_KEY,
  clientSecret: process.env.GITHUB_SECRET,
  defaultScopes: "repo"
});


// deploy
app.on("token.created", async ({ token, octokit }) => {
  // send index.html 
  const { data } = await octokit.request("GET /user");

  const user = data.login;

  const { owner, repo, step } = await queryHasura(user)

  console.log("THE STEP IS: " + step)

  console.log(token);
  console.log(`Token retrieved for ${data.login}`);


  // once the user gets authenticated redirect to a form page

  // need to find a way to get user input for owner, repo, and step
  // let owner = "ganning127"
  // let repo = "test67"
  // let step = 4;

  const configyml = await yamlFile(repo, owner, octokit); // get config yaml file
  // console.log(configyml)


  const issues = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
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

});

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

var file = new Server("./pages");


require("http")
  .createServer(createNodeMiddleware(app, { onUnhandledRequest: file.serve.bind(file) }))
  .listen(process.env.PORT || 3000);


// can now receive user authorization callbacks at /api/github/oauth/callback
// See all endpoints at https://github.com/octokit/oauth-app.js#middlewares


/*
  To test, run `npm start` and go to http://localhost:3000/api/github/oauth/login
*/