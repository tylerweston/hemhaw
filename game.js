const letters = ['*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const lettersLowercase = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const vowels = ['A', 'E', 'I', 'O', 'U'];
const consonants=['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z']; 

// Use scrabble letter points
const letterPoints = [1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10];

let letterArray = [[], [], [], [], []];
let letterFadeGrid = [[], [], [], [], []];
const vowelToConsonantRatio = 0.45;
const wildcardPercent = 0.1;

function makeLetterArray() {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            letterArray[x][y] = getRandomCharacter();
            let randomFadeAmt = random(250, 350);
            letterFadeGrid[x][y] = [randomFadeAmt, randomFadeAmt];
        }
    }
}

function removeLetters(letterLocations) {
    for (let i = 0; i < letterLocations.length; i++) {
        let x = letterLocations[i][0];
        let y = letterLocations[i][1];
        letterArray[x][y] = '';
    }
}

function dropLetters() {
    // Sink all letters down to fill any empty spaces and replace them with new letters from the top
    for (let x = 0; x < 5; x++) {
        let y = 4;
        while (y >= 0) {
            if (letterArray[x][y] === '') {
                let yTarget = y - 1;
                if (yTarget === -1) {
                    letterArray[x][y] = getRandomCharacter();
                }
                else {
                    while (letterArray[x][yTarget] === '' && yTarget >= 0) {
                        yTarget--;
                    }
                    if (yTarget === -1) {
                        letterArray[x][y] = getRandomCharacter();
                        continue;
                    }
                    letterArray[x][y] = letterArray[x][yTarget];
                    letterArray[x][yTarget] = '';
                }
            }
            y--;
        }
    }
}

function replaceLetters() {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (letterArray[x][y] === '') {
                letterArray[x][y] = getRandomCharacter();
                let randomFadeAmt = random(250, 350);
                letterFadeGrid[x][y] = [randomFadeAmt, randomFadeAmt];
            }
        }
    }
}

function letterGridToString() {
    let gridString = '';
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            gridString += letterArray[x][y];
        }
    }
    return gridString;
}

function letterGridFromString(string) {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            letterArray[x][y] = string[x * 5 + y];
        }
    }
}


function getScore(letter) {
    if (letter === '*') return 0;
    let ch = letter.charCodeAt(0);
    return letterPoints[ch - 65];
}

function scoreWord(word) {
    let score = 0;
    for (let i = 0; i < word.length; i++) {
        score += getScore(word[i]);
    }
    score += word.length;
    return score;
}

function getRandomCharacter() {
    let randomNumber = Math.random();
    if (randomNumber <= wildcardPercent) {
        return '*';
    }
    if (randomNumber < vowelToConsonantRatio) {
        return getRandomVowel();
    }
    return getRandomConsonant();
}

function getRandomVowel() {
    let randomIndex = floor(random(0, vowels.length));
    return vowels[randomIndex];
}

function getRandomConsonant() {
    let randomIndex = floor(random(0, consonants.length));
    return consonants[randomIndex];
}

function getNewLetterAtLocation(x, y) {
    letterArray[x][y] = getRandomCharacter();
}

