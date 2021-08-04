

async function sendData(event) {
    event.preventDefault();
    console.log("form submitted...");

    let username = document.getElementById('username').value;
    let repo = document.getElementById('repo').value;
    let step = document.getElementById('step').value;

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

    window.location.href = 'auth.html' // redirect to sign in


}

