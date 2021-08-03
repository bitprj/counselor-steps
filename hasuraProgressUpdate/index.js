const fetch = require("node-fetch");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const repo = req.headers.repo;
    const owner = req.headers.owner;
    const step_num = req.headers.step;

    gqlrequest = `
    mutation insertProgress {
        insert_users_progress(objects: {repo: "${repo}", user: "${owner}", count: ${step_num}, repoName: "${repo}", title: "jumped to step", path: "jumped to pat"}) {
          returning {
            id
          }
        }
      }
           
    `
    const resp = await queryData(gqlrequest);
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: resp
    };
}

const queryData = async (queryString) => {
    const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;
    const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;

    console.log(queryString)
    const data = await fetch(HASURA_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({ query: queryString })
    });
    const responseData = await data.json();

    return responseData;
};
