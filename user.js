let user; 

// note totaltime is stored in seconds, not milliseconds
function emptyUser() 
{
    // create a new user
    let newUser = 
    {
        name: '',
        totalScore: 0,
        totalTime: 0,
        totalWords: 0,
        totalLetters: 0,
        bestWords: []
    }
    storeItem('user', JSON.stringify(newUser));
}

function tryLoadUser() 
{
    if (getItem('user') === null)
    {
        // create a new user
        let newUser = 
        {
            name: getRandomUserName(),
            totalScore: 0,
            totalTime: 0,
            totalWords: 0,
            totalLetters: 0,
            bestWords: []
        }
        storeItem('user', JSON.stringify(newUser));
    }
    loadUser();
}

function saveUser() 
{
    storeItem('user', JSON.stringify(user));
}

function loadUser() 
{
    let userItem = getItem('user');
    user = JSON.parse(userItem);
}

function getRandomUserName()
{
    let pref = trie.getRandomWord(floor(random(3, 5)));
    let suff = trie.getRandomWord(floor(random(4, 6)));
    let lower1 = pref[0] + pref.slice(1).toLowerCase();
    let lower2 = suff[0] + suff.slice(1).toLowerCase();
    return `${lower1}${lower2}`;
}

function updateUserData(score, time, word)
{
    user.totalScore += score;
    user.totalTime += int(time);
    user.totalWords += 1;
    user.totalLetters += word.length;
    if (user.bestWords.length < 10) 
    {
        user.bestWords.push(word);
    } 
    else 
    {
        let min = user.bestWords[0].length;
        let minIndex = 0;
        for (let i = 1; i < user.bestWords.length; i++) 
        {
            if (user.bestWords[i].length < min) 
            {
                min = user.bestWords[i].length;
                minIndex = i;
            }
        }
        if (word.length >= min) 
            user.bestWords[minIndex] = word;
    }
    saveUser();
}
