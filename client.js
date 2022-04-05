const serverAddress = 'https://tylerweston.pythonanywhere.com';
const userEndpoint = 'user';
const scoreEndpoint = 'score';
const renameEndpoint = 'rename';
const positionEndpoint = 'globalposition';

function changeUsername() 
{
    let name = prompt("enter username:", "");
    if (name === null || name === "") {
        tryLoadUser();
        user.name = getRandomUserName();
    } else {
        tryLoadUser();
        user.name = name;
        payload = {
            name: user.name,
            hash: user.hash
        }
        renameUser(payload);
        saveUser();
    }
    // TODO: Write the new username to the database

}

async function viewHighScores()
{
    let score = await getScores();
    let res = score.text();
    res.then((data) => {
        // TODO: For now, we just use a down and dirty alert popup for this
        // at some point, we'll make this nicer and integrate it into the game
        // a bit better
        window.alert(data);
    });
}

// post a new score to the server
// note eventually this will also have to update a specific
// difficulty! it should add the new score to the users total score
async function postScore (toPost) {
    let req = `${serverAddress}/${scoreEndpoint}?hash=${toPost.hash}&score=${toPost.score}`;
        req += `&easy_score=${toPost.easy_score}&medium_score=${toPost.medium_score}`;
        req += `&hard_score=${toPost.hard_score}&blitz_score=${toPost.blitz_score}`;
    let response = await fetch(req, {method: 'POST'});
}

async function getScores () {
    let req = `${serverAddress}/${scoreEndpoint}`;
    let response = await fetch(req, {method: 'GET', headers: {'Content-Type': 'text/plain'}});
    //console.log(response);
    return response;
}

// tell the server about a new user
async function postUser (toPost) {
    let point = `${serverAddress}/${userEndpoint}?name=${toPost.name}&hash=${toPost.hash}`;
    let response = await fetch(point, {method: 'POST'});
    // console.log(response);
}

async function renameUser(toPost) 
{
    let point = `${serverAddress}/${renameEndpoint}?name=${toPost.name}&hash=${toPost.hash}`;
    let response = await fetch(point, {method: 'PUT'});
    // console.log(response);
}

// get the users global position
async function getUserPosition (toPost) {
    let point = `${serverAddress}/${positionEndpoint}?hash=${toPost.hash}`;
    let response = fetch(point, {method: 'GET', headers: {'Content-Type': 'text/plain'}});
    return response;
}
