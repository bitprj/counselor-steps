let username;
let repo;
let step;

async function sendData(event) {
    event.preventDefault();
    console.log("form submitted...");

    document.querySelector(".spinner-wrapper").classList.remove("hidden");

    step = document.getElementById("step").value;
    console.log(step);

    let options = {
        method: "POST",
        headers: {
            username, repo, step
        }
    }

    console.log(options)

    const endpoint = "https://hasuraprogressupdate.azurewebsites.net/api/hasuraUpdate?code=rmiHSNuElvwXaYE5uT6hqJjxswAYxplfyAqLaP27AjaDafcmeY2ZEw=="
    let resp = await fetch(endpoint, options)
    let data = await resp.json();

    document.querySelector(".spinner-wrapper").classList.add("hidden");

    window.location.href = 'auth.html' // redirect to sign in


}

document.getElementById("nextStep").addEventListener("click", async () => {

    document.getElementById("s1").classList.add("hidden");
    document.getElementById("s2").classList.remove("hidden");

    username = document.getElementById('username').value;
    repo = document.getElementById('repo').value;

    console.log(username)
    console.log(repo)

    await populateSelect(username, repo);
})

async function populateSelect(username, repo) {
    const endpoint = `https://raw.githubusercontent.com/${username}/${repo}/main/.bit/config.yml`
    let resp = await fetch(endpoint);
    let data = await resp.text();

    let jsonYaml = jsyaml.load(data)
    console.log(jsonYaml)

    for (var i = 0; i < jsonYaml.steps.length; i++) {
        let currStep = jsonYaml.steps[i];
        for (var j = 0; j < currStep.actions.length; j++) {
            if (currStep.actions[j].type === "createIssue") {
                // create the option element and append to dropdown
                createOption(currStep.actions[j].title, i + 1)
            }
        }
    }
}

function createOption(text, value) {
    let stepSelect = document.getElementById("step");
    let option = document.createElement("option");
    option.value = value;
    option.innerHTML = text;

    stepSelect.appendChild(option);
}