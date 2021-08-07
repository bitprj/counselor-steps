console.log("test")



window.onload = async () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const code = urlParams.get('code');

    console.log(code);

    const endpoint = "";
    const options = {
        headers: {
            code: code
        }
    }
    let resp = await fetch(endpoint, code);
    console.log(resp);
}