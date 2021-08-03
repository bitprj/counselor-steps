const fetch = require("node-fetch")

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  const repo = req.headers.repo;
  const step = req.headers.step;
  const username = req.headers.username;

  const queryString = `
    mutation MyMutation {
        insert_users_users_skip_step(objects: {username: "${username}", step: ${step}, repo: "${repo}"}) {
          returning {
            username
          }
        }
      }`;

  const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;
  const secret = process.env.HASURA_ADMIN_SECRET;

  context.log(JSON.stringify(queryString))
  const data = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': secret,
    },
    body: JSON.stringify({ query: queryString })
  });
  const responseData = await data.json();
  console.log(responseData)

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: { responseData }
  };


}