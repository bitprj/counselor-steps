console.log("test")



window.onload = async () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const code = urlParams.get('code');

    console.log(code);

    const endpoint = "https://hasuraprogressupdate.azurewebsites.net/api/octokitActions?code=yNZKwqGeRcuvFCUIm4MaS0u/doKx0z0y/gwYyQXbM5x3OSUGVysaOw==";
    const options = {
        headers: {
            code: code
        }
    }
    let resp = await fetch(endpoint, options);
    console.log(resp);
}