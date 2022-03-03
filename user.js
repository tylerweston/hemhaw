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
    user.rank = getRank();
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
    user.totalTime += time;
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

function showUserInfo() {
    fill(0, 10);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    textSize(gridSize);
    fill(color(textColor));
    strokeWeight(5);
    stroke(0, 50);
    let [rank, nextRank] = getRankAndRemaining();
    text(`${user.name}`, width / 2, gridSize);
    textSize(gridSize / 2);
    text(`rank:${rank}/pts to next:${nextRank}`, width / 2, gridSize * 1.5);
    textSize(gridSize / 3);
    let scoreText = processScore(user.totalScore);
    let timeText = processTime(user.totalTime);
    let wordsText = processWords(user.totalWords);
    text(
    "total score: " + scoreText + "\n" +
    "total time: " + timeText + "\n" +
    "total words: " + wordsText + "\n" +
    "best words:\n" + getBestWords(), width / 2, height / 2);
    textSize(gridSize / 4);
    text("top scores:\n" + topScores(), width / 2, height - gridSize * 1);
}

function getRank()
{
    // TODO: Cache this
    //return pointsToRank();
    let [rank, _] = getRankAndRemaining();
    return rank;
}

function getRankAndRemaining()
{
    let points = user.totalScore;
    let lvl = 100;
    let rank = 0;
    while (true)
    {
        if (points - lvl >= 0)
        {
            points -= lvl;
            rank++;
            lvl += 10 * rank;
        }
        else
        {
            return [rank, lvl - points];
        }
    }
}

function getBestWords() {
    let bestWords = user.bestWords.sort((x, y) => y.length - x.length);
    bestWords = bestWords.slice(0, 5);
    let text = '';
    for (let i = 0; i < bestWords.length; i++) {
        text += `${bestWords[i]}\n`;
    }
    return text;
}

function topScores() {
    let topScoresTexts = '';
    for (let i = 0; i < highScores.length; i++) {
        topScoresTexts += `${difficulties[i].name}: ${processScore(highScores[i])}\n`;
    }
    return topScoresTexts;
}

function processScore(score)
{
    let scoreText = score.toLocaleString();
    return scoreText;
}

function processTime(time)
{
    // convert to seconds
    time = Math.floor(time / 1000);
    // convert seconds to days, hours, minutes, and seconds
    let days = Math.floor(time / (24 * 60 * 60));
    let hours = Math.floor((time % (24 * 60 * 60)) / (60 * 60));
    let minutes = Math.floor((time % (60 * 60)) / 60);
    let seconds = Math.floor(time % 60);
    let timeText = '';
    if (days > 0)
    {
        timeText += `${days} d `;
    }
    if (hours > 0)
    {
        timeText += `${hours} h `;
    }
    if (minutes > 0)
    {
        timeText += `${minutes} m `;
    }
    if (seconds > 0)
    {
        timeText += `${nf(seconds, 2)} s`;
    }
    if (timeText === '')
        timeText = '0';
    return timeText;
}

function processWords(words)
{
    return words;
}
