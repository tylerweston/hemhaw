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
- rename, horrible name!
- Try with just replacing used tiles, not sliding them
- add a timer? Different game modes?
- add score juice
- Permanent high score
- add sound effects
- should letters randomly change?
- way to shake entire board if you are stuck?
- show letter score on each tile?
- we don't need to keep the wordlist loaded after we create the trie? How do we deal with that?
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

const startingMinutes = 0.5;
let score = 0;
let highScore = 0;
let timer = 1000 * 60 * startingMinutes;  //msec * sec * min

let isGameOver = false;

const slidingMaxTime = 250;
let slidingTimer = 0;
let rowSliding = false;
let colSliding = false;
let slidingDirection = 1;
let doingSlide = false;

function setup() { 
    cnv = createCanvas(gameWidth, gameHeight);
    centerCanvas();
    makeLetterArray();
    trie = new Trie();
    populateTrie();
    loadRandomPalette();
    let tryHighScore = getItem('highScore');
    if (tryHighScore !== null) 
    {
        highScore = tryHighScore;
    } 
    else
    {
        storeItem('highScore', 0);
    }
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
    // The main loop
    if (isGameOver) {
        gameOver();
        return;
    }

    runTimers();

    drawBackground();
    drawLetterArray();
    drawOutlines();
    drawArrows();

    drawHighlights();
    highlightClickTrail();
    drawCurrentWord();
    drawUI();
    drawShading();
}

function drawShading() {
    noFill();
    stroke(0, 50);
    strokeWeight(8);
    rect(gridSize, gridSize, gridSize * 5, gridSize * 5);
}

function runTimers() {
    timer -= deltaTime;
    if (doingSlide) {
        slidingTimer += deltaTime;
        if (slidingTimer >= slidingMaxTime) {
            doingSlide = false;
            slideLine(rowSliding, colSliding, slidingDirection);
            rowSliding = false;
            colSliding = false;
            slidingTimer = 0;
        }
    }
    if (timer <= 0)
    {
        // this is fired once so we can store high score here
        if (score > highScore)
        {
            highScore = score;
            storeItem('highScore', highScore);
        }
        timer = 0;
        // gameOver();
        isGameOver = true;
    }
}

function gameOver()
{
    // show a game over screen with final score, high score
    // and option to start again
    fill(0, 10);
    rect(0, 0, gameWidth, gameHeight);
    textSize(gridSize / 2);
    textAlign(CENTER, CENTER);
    stroke(color(backgroundColor));
    fill(color(textColor));
    strokeWeight(2);
    text('click to\nplay again\n\nfinal score: ' + score + "\nhigh score: " + highScore, gameWidth / 2, gameHeight / 2);
}

function resetGame()
{
    score = 0;
    timer = 1000 * 60 * startingMinutes;
    isGameOver = false;
    currentWord = '';
    clickedTrail = [];
    lastClicked = [];
    savedTrail = [];
    highlightCounter = 0;
    highlightColor = '#000000';
    savedWord = '';
    scoreJustAdded = 0;
    scrollTimer = 0;
    loadRandomPalette();
    makeLetterArray();
}

function drawBackground() {
    background(color(backgroundColor));
}

function drawOutlines() {
    noStroke();
    fill(color(backgroundColor));
    rect(0, 0, gameWidth, gridSize);
    rect(0, gridSize, gridSize, gameHeight);
    rect(gameWidth - gridSize, gridSize, gridSize, gameHeight);
    rect(0, gameHeight - gridSize * 2, gameWidth - gridSize, gameHeight);

    fill(0, 80);
    rect(0, 6.5 * gridSize, gameWidth, gridSize);
    noFill();
    stroke(0, 50);
    strokeWeight(8);
    rect(0, 0, gameWidth, gameHeight);

}

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
    textSize(gridSize/3);
    textAlign(CENTER, BASELINE);
    noStroke();
    fill(52, 180);
    let displayTimeRaw = int(timer / 1000);
    let minutes = floor(displayTimeRaw / 60);
    let seconds = displayTimeRaw % 60;
    let displayTime = minutes + ':' + nf(seconds, 2);
    text('Score: ' + score + " Timer: " + displayTime, gameWidth / 2, gameHeight - gridSize / 8);
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
    // outline letter grid
    strokeWeight(3);
    stroke(0, 40);
    fill(color(gridColor));
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            rect((x + 1) * gridSize, (y + 1) * gridSize, gridSize, gridSize);
        }
    }

    // draw letters

    textAlign(CENTER, CENTER);

    let slideDistanceOffset = map(slidingTimer, 0, slidingMaxTime, 0, gridSize);

    let xSlidingOffIndex = slidingDirection === 1 ? 4 : 0;
    let ySlidingOffIndex = slidingDirection === 1 ? 4 : 0;

    for (let x = 0; x <= 4; x++) 
    {
        for (let y = 0; y <= 4; y++) 
        {
            let xOffset = 0;
            let yOffset = 0;
            if (rowSliding !== false && y === rowSliding) {
                xOffset = slideDistanceOffset * slidingDirection;
            }
            if (colSliding !== false && x === colSliding) {
                yOffset = slideDistanceOffset * slidingDirection;
            }
            let ch = letterArray[x][y];
            if (ch === '*') ch = '∗';
            textSize(gridSize * 0.85);
            // hightlight
            stroke(220, 60);
            fill(0);
            strokeWeight(4);
            text(ch, 
                (x + 1) * gridSize + gridSize / 2 - 1 + xOffset, 
                (y + 1) * gridSize + gridSize / 2 - 1 + yOffset);
            // dark shadow
            stroke(0, 70);
            text(ch, 
                (x + 1) * gridSize + gridSize / 2 + 1 + xOffset, 
                (y + 1) * gridSize + gridSize / 2 + 1 + yOffset);
            // regular letter
            stroke(100, 150);
            strokeWeight(1);
            fill(color(textColor));
            text(ch, 
                (x + 1) * gridSize + gridSize / 2 + xOffset, 
                (y + 1) * gridSize + gridSize / 2 + yOffset);

            // if we are the letter that is currently sliding off the board,
            // we have to be redrawn wrapped around
            // TODO: Maybe render the tile as an image so we don't have to repeat this
            // and we can just redraw the image
            if ((rowSliding !== false && y === rowSliding && x === xSlidingOffIndex) 
                || (colSliding !== false && x === colSliding && y === ySlidingOffIndex)) {
                // figure out which way to wrap around
                let wrappedXPos = x + 1;
                let wrappedYPos = y + 1;
                if (rowSliding !== false && y === rowSliding) {
                    wrappedXPos = xSlidingOffIndex === 0 ? 6 : 0;
                } else if (colSliding !== false && x === colSliding) {
                    wrappedYPos = ySlidingOffIndex === 0 ? 6 : 0;
                }
                // draw wrapped around letter
                stroke(220, 60);
                fill(0);
                strokeWeight(4);
                text(ch, 
                    (wrappedXPos) * gridSize + gridSize / 2 - 1 + xOffset, 
                    (wrappedYPos) * gridSize + gridSize / 2 - 1 + yOffset);
                // dark shadow
                stroke(0, 70);
                text(ch, 
                    (wrappedXPos) * gridSize + gridSize / 2 + 1 + xOffset, 
                    (wrappedYPos) * gridSize + gridSize / 2 + 1 + yOffset);
                // regular letter
                stroke(100, 150);
                strokeWeight(1);
                fill(color(textColor));
                text(ch, 
                    (wrappedXPos) * gridSize + gridSize / 2 + xOffset, 
                    (wrappedYPos) * gridSize + gridSize / 2 + yOffset);
                // draw score
                fill(0, 130);
                let gridEigth = gridSize / 8;
                textSize(gridSize / 4);
                let score = getScore(ch);
                text(score, 
                    (wrappedXPos + 1) * gridSize - gridEigth + xOffset, 
                    (wrappedYPos + 1) * gridSize - gridEigth + yOffset);
            }
            // draw score
            fill(0, 130);
            let gridEigth = gridSize / 8;
            textSize(gridSize / 4);
            let score = getScore(ch);
            text(score, 
                (x + 2) * gridSize - gridEigth + xOffset, 
                (y + 2) * gridSize - gridEigth + yOffset);
        }
    }
}

function getScore(letter) {
    if (letter === '*') return 0;
    let ch = letter.charCodeAt(0);
    return letterPoints[ch - 65];
}

function slideLine(row, col, direction) {
    if (row !== false)
    {
        // we are sliding a row
        // if direction = 1 we are sliding right
        let tempIndex = direction === 1 ? 0 : 4;
        let tempLetter = letterArray[4 - tempIndex][row];
        for (let x = 4 - tempIndex; x !== tempIndex; x -= direction) {
            letterArray[x][row] = letterArray[x - direction][row];
        }
        letterArray[tempIndex][row] = tempLetter;
    }
    else if (col !== false)
    {
        // we are sliding a column
        // if direction = 1 we are sliding down
        let tempIndex = direction === 1 ? 0 : 4;
        let tempLetter = letterArray[col][4 - tempIndex];
        for (let y = 4 - tempIndex; y !== tempIndex; y -= direction) {
            letterArray[col][y] = letterArray[col][y - direction];
        }
        letterArray[col][tempIndex] = tempLetter;
    }
}

function mouseClicked(event) {
    // TODO: Allow right click to move a line the opposite direction
    if (mouseX < gridSize / 2 && mouseY < gridSize / 2) {
        loadRandomPalette();
    }
    // check if we are in the leftmost or rightmost column
    let x = floor(mouseX / gridSize);
    let y = floor(mouseY / gridSize);
    let gridX = x - 1;
    let gridY = y - 1;
    // TODO: DRY this out
    // TODO: We need to wait for the animation to finish before we switch the grid letters!
    if (x === 0 && y > 0 && y < 6) {
        // let temp = letterArray[4][gridY];
        // for (let x = 4; x > 0; x--) {
        //     letterArray[x][gridY] = letterArray[x - 1][gridY];
        // }
        // letterArray[0][gridY] = temp;
        rowSliding = gridY;
        slidingDirection = 1;
        doingSlide = true;
    }
    if (x === 6 && y > 0 && y < 6) {
        // let temp = letterArray[0][gridY];
        // for (let x = 0; x < 4; x++) {
        //     letterArray[x][gridY] = letterArray[x + 1][gridY];
        // }
        // letterArray[4][gridY] = temp;
        rowSliding = gridY;
        slidingDirection = -1;
        doingSlide = true;

    }
    if (y === 0 && x > 0 && x < 6) {
        // let temp = letterArray[gridX][4];
        // for (let y = 4; y > 0; y--) {
        //     letterArray[gridX][y] = letterArray[gridX][y - 1];
        // }
        // letterArray[gridX][0] = temp;
        colSliding = gridX;
        slidingDirection = 1;
        doingSlide = true;

    }
    if (y === 6 && x > 0 && x < 6) {
        // let temp = letterArray[gridX][0];
        // for (let y = 0; y < 4; y++) {
        //     letterArray[gridX][y] = letterArray[gridX][y + 1];
        // }
        // letterArray[gridX][4] = temp;
        colSliding = gridX;
        slidingDirection = -1;
        doingSlide = true;

    }
}

function mouseDragged() {
    if (mouseX < gridSize || 
        mouseY < gridSize || 
        mouseX > gameWidth - gridSize || 
        mouseY > gameHeight - gridSize) 
    {
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
            if (doGridsTouch(lastClicked[0], lastClicked[1], gridX, gridY)) 
            {
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
    let realX = floor(mouseX / gridSize);
    let realY = floor(mouseY / gridSize);
    let gridX = realX - 1;
    let gridY = realY - 1;
    return [gridX, gridY];
}

function mouseReleased() {
    if (isGameOver)
    {
        resetGame();
        return;
    }
    doWordCheck();
}

function doWordCheck() {
    let isWord = checkWord(currentWord);
    if (isWord) {
        highlightColor = '#00EE00';
        scoreJustAdded = scoreWord(currentWord)
        score += scoreJustAdded;
        timer += (scoreJustAdded * 500);    // half second per point
        if (score > highScore)
        {
            highScore = score;
        }
        removeLetters(clickedTrail);
        replaceLetters();
        // dropLetters();
    } else {
        highlightColor = '#EE0000';
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
            line(lastLocation[0] * gridSize + gridSize / 2, 
                lastLocation[1] * gridSize + gridSize / 2, 
                x * gridSize + gridSize / 2, 
                y * gridSize + gridSize / 2);
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


  