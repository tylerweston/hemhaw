const serverAddress = 'https://tylerweston.pythonanywhere.com';
const userEndpoint = 'user';
const scoreEndpoint = 'score';
const renameEndpoint = 'rename';
const positionEndpoint = 'globalposition';

function eraseUser()
{
    let res = window.confirm("this will erase ALL OF YOUR SAVED DATA and DELETE YOUR USER. are you sure?");
    console.log(res);
    if (!res)
        return
    clearStorage();
    loadRandomPalette();
    tryLoadUser();
}

function changeUsername() 
{
    let name = prompt("enter username:", "");
    if (name === null || name === "") {
        return;
        // tryLoadUser();
        // user.name = getRandomUserName();
    } else {
        if (name.length > 32) {
            alert("username too long, 32 character max");
            return;
        }
        tryLoadUser();
        user.name = name;
        payload = {
            name: user.name,
            hash: user.hash
        }
        renameUser(payload);
        saveUser();
    }
}

async function viewHighScores()
{
    let score = await getScores();
    let res = score.text();
    res.then((data) => {
        // TODO: For now, we just use a down and dirty alert popup for this
        // at some point, we'll make this nicer and integrate it into the game
        // a bit better
        // data = 'highscores:\n' + data;
        let scores = data.split('\n');
        let output = 'highscores:\n';
        for (let i = 0; i < scores.length; i++) {
            output += `${i+1}. ${scores[i]}\n`;
        }
        window.alert(output);
    });
}

// post a new score to the server
async function postScore (toPost) {
    let req = `${serverAddress}/${scoreEndpoint}?hash=${toPost.hash}&score=${toPost.score}`;
        req += `&easy_score=${toPost.easy_score}&medium_score=${toPost.medium_score}`;
        req += `&hard_score=${toPost.hard_score}&blitz_score=${toPost.blitz_score}`;
    let response = await fetch(req, {method: 'POST'});
    // TODO: Error check response?
}

async function getScores () {
    let req = `${serverAddress}/${scoreEndpoint}`;
    let response = await fetch(req, {method: 'GET', headers: {'Content-Type': 'text/plain'}});
    return response;
}

// tell the server about a new user
async function postUser (toPost) {
    let point = `${serverAddress}/${userEndpoint}?name=${toPost.name}&hash=${toPost.hash}`;
    let response = await fetch(point, {method: 'POST'});
    // TODO: Error check response?
}

async function renameUser(toPost) 
{
    let point = `${serverAddress}/${renameEndpoint}?name=${toPost.name}&hash=${toPost.hash}`;
    let response = await fetch(point, {method: 'PUT'});
    // TODO: Error check response?
}

// get the users global position
async function getUserPosition (toPost) {
    let point = `${serverAddress}/${positionEndpoint}?hash=${toPost.hash}`;
    let response = fetch(point, {method: 'GET', headers: {'Content-Type': 'text/plain'}});
    // TODO: Error check response?   
    return response;
}
