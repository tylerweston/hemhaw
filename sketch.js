/* 
werdgle
Created by mkp5 on 15/02/2022 15:08:53
 */
let cnv;
/*
Grid is 7 wide
and
8 tall
*/

/*
TODO:
- add a timer
- add score juice
- add sound effects
- should letters randomly change?
- way to shake entire board if you are stuck?
- show letter score on each tile?
- we don't need to keep the wordlist loaded after we create the trie
*/
let gridSize = 90;
let gameWidth = 7 * gridSize;
let gameHeight = 8 * gridSize;

let currentWord = '';

let clickedTrail = [];
let lastClicked = [];

let savedTrail = [];
let highlightCounter = 0;
let highlightColor = '#000000';
let savedWord = '';
let scoreJustAdded = 0;
let scrollTimer = 0;

let trie;

let backgroundColor;
let correctColor;
let incorrectColor;
let textColor;
let gridColor;

let score = 0;
let timer = 0;

function setup() { 
    cnv = createCanvas(gameWidth, gameHeight);
    centerCanvas();
    makeLetterArray();
    trie = new Trie();
    populateTrie();
    loadRandomPalette();
} 

function populateTrie() {
    let listOfWords = wordlist();
    for (let i = 0; i < listOfWords.length; i++) {
        trie.add(listOfWords[i]);
    }
}

function loadRandomPalette() {
    let randomPaletteIndex = floor(random(0, palettes.length));
    let randomPalette = palettes[randomPaletteIndex];
    [backgroundColor, correctColor, incorrectColor, textColor, gridColor] = randomPalette;
}

function draw() { 
    background(color(backgroundColor));
    fill(0, 80);
    rect(0, 6.5 * gridSize, gameWidth, gridSize);
    noFill();
    stroke(0, 50);
    strokeWeight(8);
    rect(0, 0, gameWidth, gameHeight);

    drawArrows();
    drawLetterArray();
    drawHighlights();
    highlightClickTrail();
    drawCurrentWord();
    drawUI();

    noFill();
    stroke(0, 50);
    strokeWeight(8);
    rect(gridSize, gridSize, gridSize * 5, gridSize * 5);
}

// function replaceRandomLetter() {
//     // UNUSED
//     if (Math.random() < 0.005) {
//         let xRandom = floor(random(0, 5));
//         let yRandom = floor(random(0, 5));
//         // if this x and y location are in our clicked trail, don't change it
//         if (!isLocationSelected(xRandom, yRandom))
//         {
//             getNewLetterAtLocation(xRandom, yRandom);
//         }
//     }
// }

function drawArrows() {
    let arrowSize = gridSize / 2;
    textAlign(CENTER, CENTER);
    textSize(arrowSize);

    for (let y = 1; y <= 5; y++) {
        if (isMouseCloseToCenterOfSquare(0, y)) {
            fill(color(correctColor));
        } else {
            fill(color(textColor));
        }
        text('>', gridSize / 2, gridSize * y + gridSize / 2);
        if (isMouseCloseToCenterOfSquare(6, y)) {
            fill(color(correctColor));
        } else {
            fill(color(textColor));
        }
        text('<', gridSize * 6 + gridSize / 2, gridSize * y + gridSize / 2);
    }
    for (let x = 1; x <= 5; x++) {
        if (isMouseCloseToCenterOfSquare(x, 0)) {
            fill(color(correctColor));
        } else {
            fill(color(textColor));
        }
        text('v', gridSize * x + gridSize / 2, gridSize / 2);
        if (isMouseCloseToCenterOfSquare(x, 6)) {
            fill(color(correctColor));
        } else {
            fill(color(textColor));
        }
        text('^', gridSize * x + gridSize / 2, gridSize * 6 + gridSize / 2);
    }
}

function drawUI() {
    textSize(gridSize/2);
    textAlign(CENTER, BASELINE);
    noStroke();
    fill(0, 180);
    text('Score: ' + score, gameWidth / 2, gameHeight - gridSize / 8);
}

function drawHighlights() {
    const maxTime = 1500;
    let highlightColorAlpha = color(highlightColor);
    highlightColorAlpha.setAlpha(map(highlightCounter, 0, maxTime, 150, 0));
    noStroke();
    fill(highlightColorAlpha);
    for (let i = 0; i < savedTrail.length; i++) {
        let x = savedTrail[i][0];
        let y = savedTrail[i][1];
        rect((x + 1) * gridSize + 1, (y + 1) * gridSize + 1, gridSize - 2, gridSize - 2);
    }
    // draw saved text
    if (savedWord) {
        let textsizeGuess = gridSize;
        textSize(textsizeGuess);
        while (textWidth(savedWord) > gameWidth) {
            textsizeGuess--;
            textSize(textsizeGuess);
        }
        textAlign(CENTER, CENTER);
        noStroke();
        fill(highlightColorAlpha);
        text(savedWord.toUpperCase(), gameWidth / 2, 6 * gridSize + gridSize);
    }
    
    // show recently gotten score
    if (scoreJustAdded) {
        textSize(gridSize/2);
        textAlign(CENTER, BASELINE);
        noStroke();
        fill(0);
        let textLeft = map(highlightCounter, 0, maxTime, 0, gameWidth);
        text('+' + scoreJustAdded, textLeft , gameHeight - gridSize / 8);
    }

    highlightCounter += deltaTime;
    if (highlightCounter > maxTime) {
        savedTrail = [];
        savedWord = null;
        highlightCounter = 0;
        highlightColor = '#000000';
        scoreJustAdded = null;
    }
}

function isLocationSelected(x, y)
{
    for (let i = 0; i < clickedTrail.length; i++) {
        if (clickedTrail[i][0] === x && clickedTrail[i][1] === y) {
            return true;
        }
    }
    return false;
}

function drawLetterArray() {
    // outline letters
    strokeWeight(3);
    stroke(0, 40);
    fill(color(gridColor));
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            rect((i + 1) * gridSize, (j + 1) * gridSize, gridSize, gridSize);
        }
    }

    // draw letters
    textSize(gridSize * 0.9);
    textAlign(CENTER, CENTER);

    // letter shading
    stroke(220, 60);
    fill(0);
    strokeWeight(4);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let ch = letterArray[i][j];
            if (ch === '*') ch = '∗';
            text(ch, (i + 1) * gridSize + gridSize / 2 - 1, (j + 1) * gridSize + gridSize / 2 - 1);
        }
    }
    stroke(0, 70);
    fill(0);
    strokeWeight(4);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let ch = letterArray[i][j];
            if (ch === '*') ch = '∗';
            text(ch, (i + 1) * gridSize + gridSize / 2 + 1, (j + 1) * gridSize + gridSize / 2 + 1);
        }
    }

    stroke(0, 50);
    noStroke();
    fill(color(textColor));
    //strokeWeight(2);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let ch = letterArray[i][j];
            if (ch === '*') ch = '∗';
            text(ch, (i + 1) * gridSize + gridSize / 2, (j + 1) * gridSize + gridSize / 2);
        }
    }

    // draw scores
    fill(0, 130);
    let gridEigth = gridSize / 8;
    textSize(gridSize / 4);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            // get score for letter

            let ch = letterArray[i][j];
            if (ch === '*') continue;
            let score = getScore(ch);
            text(score, (i + 2) * gridSize - gridEigth, (j + 2) * gridSize - gridEigth);
        }
    }
    
}

function getScore(letter) {
    if (letter === '*') return 0;
    let ch = letter.charCodeAt(0);
    return letterPoints[ch - 65];
}

function mouseClicked() {
    // console.log("mouse pressed");
    if (mouseX < gridSize / 2 && mouseY < gridSize / 2) {
        loadRandomPalette();
    }
    // check if we are in the leftmost or rightmost column
    let x = floor(mouseX / gridSize);
    let y = floor(mouseY / gridSize);
    let gridX = x - 1;
    let gridY = y - 1;
    if (x === 0 && y > 0 && y < 6) {
        let temp = letterArray[4][gridY];
        for (let x = 4; x > 0; x--) {
            letterArray[x][gridY] = letterArray[x - 1][gridY];
        }
        letterArray[0][gridY] = temp;
    }
    if (x === 6 && y > 0 && y < 6) {
        let temp = letterArray[0][gridY];
        for (let x = 0; x < 4; x++) {
            letterArray[x][gridY] = letterArray[x + 1][gridY];
        }
        letterArray[4][gridY] = temp;
    }
    if (y === 0 && x > 0 && x < 6) {
        let temp = letterArray[gridX][4];
        for (let y = 4; y > 0; y--) {
            letterArray[gridX][y] = letterArray[gridX][y - 1];
        }
        letterArray[gridX][0] = temp;
    }
    if (y === 6 && x > 0 && x < 6) {
        let temp = letterArray[gridX][0];
        for (let y = 0; y < 4; y++) {
            letterArray[gridX][y] = letterArray[gridX][y + 1];
        }
        letterArray[gridX][4] = temp;
    }

}

function mouseDragged() {
    if (mouseX < gridSize || mouseY < gridSize || mouseX > gameWidth - gridSize || mouseY > gameHeight - gridSize) {
        // stop the current drag without scoring
        currentWord = '';
        clickedTrail = [];
        lastClicked = [];
        return;
    };
    [gridX, gridY] = getClosestSquare();
    if (gridX >= 0 && gridX <= 4 && gridY >= 0 && gridY <= 4 
        && !isLocationSelected(gridX, gridY) 
        && isMouseCloseToCenterOfSquare(gridX + 1, gridY + 1)) {
        // make sure we're the first click or touching the last location selected
        if (lastClicked.length === 0)
        {
            lastClicked = [gridX, gridY];
        }
        else
        {
            if (doGridsTouch(lastClicked[0], lastClicked[1], gridX, gridY)) {
                lastClicked = [gridX, gridY];
            }
            else
            {
                // nothing else to do, stop handling mouse click
                return;
            }
        }
        let selectedLetter = letterArray[gridX][gridY];
        currentWord += selectedLetter;
        clickedTrail.push([gridX, gridY]);
    }     
    return false;
}

function isMouseCloseToCenterOfSquare(gridX, gridY) {
    // Check that the mouse is within a certain distance to the center of a given grid location.
    // This is used to make it easier to select diagonally.
    let x = gridX  * gridSize + gridSize / 2;
    let y = gridY * gridSize + gridSize / 2;
    let dx = mouseX - x;
    let dy = mouseY - y;
    let dist = sqrt(dx * dx + dy * dy);
    return dist < gridSize / 2;
}

function getClosestSquare() {
    // TODO: Don't check very edges of boxes since it makes it difficult to select diagonally
    let realX = floor(mouseX / gridSize);
    let realY = floor(mouseY / gridSize);
    let gridX = realX - 1;
    let gridY = realY - 1;
    return [gridX, gridY];
}

function mouseReleased() {
    doWordCheck();
}

function doWordCheck() {
    let isWord = checkWord(currentWordLower());
    if (isWord) {
        highlightColor = '#00FF00';
        scoreJustAdded = scoreWord(currentWordLower())
        score += scoreJustAdded;
        removeLetters(clickedTrail);
        dropLetters();
    }
    else {
        highlightColor = '#FF0000';
    }
    // start the highlight
    highlightCounter = 0;
    savedTrail = clickedTrail;
    savedWord = isWord;

    currentWord = '';
    clickedTrail = [];
    lastClicked = [];

}

function currentWordLower() {
    return currentWord.toLowerCase();
}

function drawCurrentWord() {
    let textsizeGuess = gridSize;
    textSize(textsizeGuess);
    while (textWidth(currentWord) > gameWidth) {
        textsizeGuess--;
        textSize(textsizeGuess);
    }
    textAlign(CENTER, CENTER);
    noStroke();
    fill(0, 170);
    text(currentWord, gameWidth / 2, 6 * gridSize + gridSize);
}

function highlightClickTrail() {
    // highlight squares
    noStroke();

    for (let i = 0; i < clickedTrail.length; i++) {
        fill(175, map(i, 0, clickedTrail.length, 75, 125));
        let x = clickedTrail[i][0] + 1;
        let y = clickedTrail[i][1] + 1;

        rect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
    }
    // draw the line
    let lastLocation = [];

    strokeWeight(4);
    noFill();
    for (let i = 0; i < clickedTrail.length; i++) {
        let alph = map(i, 0, clickedTrail.length, 50, 175);
        stroke(255, alph);
        let x = clickedTrail[i][0] + 1;
        let y = clickedTrail[i][1] + 1;
        if (lastLocation.length > 0) {
            line(lastLocation[0] * gridSize + gridSize / 2, lastLocation[1] * gridSize + gridSize / 2, x * gridSize + gridSize / 2, y * gridSize + gridSize / 2);
        }
        lastLocation = [x, y];
    }
}

function windowResized() {
    centerCanvas();
}

function centerCanvas() {
    let x = (windowWidth - width) / 2;
    let y = (windowHeight - height) / 2;
    cnv.position(x, y);
}

function doGridsTouch(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
}

function checkWord(word) {
    return trie.search(word);
}


  