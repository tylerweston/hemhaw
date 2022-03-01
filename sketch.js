/* 
hemhaw
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
- REFACTOR. Getting big enough that it will be worth refactoring to make it more maintanable in the future.
    - Rewrite things as classes
        - Tiles
        - Board
        - Player
        - Game
        - States
        - Scoring
        - Trail
        - Effects
- Classes all have:
    - Run
    - Draw
    - Remove
- easy: two minute start, 1 second per point
- medium: one minute start, 1/2 second per point
- hard: 30 second start, 1/3 second per point
- blitz: 5 seconds, 1/s second per points
- unlimited: no timer, no score

- if you try to exit with a game saved, present options
    - save and exit
    - resume
    - discard and exit

- lock a row and column and can only be unlocked if used in a word
- add hemhaw easter egg, if you ever spell it out do something cool
- add sound effects
- we don't need to keep the wordlist loaded after we create the trie? How do we deal with that?
- add more palettes
- more particle effects and better scoring juice
- add a leaderboard and highest word scores
- a bit of jankiness with holding down arrow buttons to shift

- if you move a grid that has lines drawn on it, move the lines with the grid

saved game needs:
- difficulty
- score
- timer
- board

*/
let gridSize;
let gameWidth;
let gameHeight;

let currentWord = '';
let clickedTrail = [];
let lastClicked = [];
let lastGridPos;

let savedTrail = [];
let highlightCounter = 0;
let highlightColor = '#000000';
let savedWord = '';
let scoreJustAdded = 0;
let scrollTimer = 0;
const maxScrollTimer = 2500;

let mainCountdown = 3000;

let gameOverMouseCount = 0;

let trie;

let gameState;

// palette data
let backgroundColor;
let correctColor;
let highlightedSquareColor;
let textColor;
let gridColor;

let score = 0;
let highScore = 0;
let storedHighscore = 0;
let gotNewHighscore = false;
let shownNewHighscore = false;
let timer;
let totalTimePlayed = 0;

let isGameOver = false;
let eatGameoverClickFlag = false;
let exitToMainMenuTimer = 0;

const maxHightlightTime = 1000;
const slidingMaxTime = 200;
let slidingTimer = 0;
let rowSliding = false;
let colSliding = false;
let slidingDirection = 1;
let doingSlide = false;
let originalArrowX = 0;
let originalArrowY = 0;

let deBroglieTimer = 0;

// note these have to add up to 100 maximum
const letterBonusPercentage = 0.1;
const wordBonusPercentage = 0.05;

const lockedTilePercentage = 0.0005;
// const lockedTilePercentage = 1;
const maxLockedTiles = 2;

let bonusTiles = [];
let animatedBonusTiles = [];
let lockedTiles = [];
let animatedLockedTiles = [];

let mainMenuNeedUnclick = false;
let mainMenuClickTimer = 0;
let mainMenuSelected = 0;

let highlightLine;

class BonusTileType {
    static TripleLetter = new BonusTileType('Triple Letter');
    static DoubleLetter = new BonusTileType('Double Letter');
    static TripleWord = new BonusTileType('Triple Word');
    static DoubleWord = new BonusTileType('Double Word');
    constructor(name) {
        this.name = name;
    }
}

class GameStates {
    static Intro = new GameStates('Intro');
    static MainMenu = new GameStates('Main Menu');
    static Countdown = new GameStates('Countdown');
    static MainGame = new GameStates('Main Game');
    static EndGame = new GameStates('End Game');
}

let gameDifficulty = 0;
const difficulties = {
    0: {name: 'easy', minutes: 2, secondPerScore: 0.5},
    1: {name: 'medium', minutes: 1, secondPerScore: 0.33},
    2: {name: 'hard', minutes: 0.5, secondPerScore: 0.25},
    3: {name: 'blitz', minutes: 0.1, secondPerScore: 0.25},
    4: {name: 'unlimited', minutes: -1, secondPerScore: 0}
}

// Track highscores across the 4 levels
let highScores = [0, 0, 0, 0];

let haveSavedGame = false;
let playingSavedGame = false;

let particles = [];
let smoothClock = 0;

let introLength = 1000;
let introTimer; // = 0;

function spawnParticle(pos, vel, color, size, life) {
    particles.push({
        pos: pos,
        vel: vel,
        color: color,
        size: size,
        life: life
    });
}

function runParticles() {
    if (particles.length === 0) return;
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].pos[0] += particles[i].vel[0];
        particles[i].pos[1] += particles[i].vel[1];
        particles[i].life -= deltaTime;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        let c = particles[i].color;
        // c.setAlpha(particles[i].life / 3);;
        fill(particles[i].color);
        noStroke();
        ellipse(particles[i].pos[0], 
            particles[i].pos[1], 
            particles[i].size, 
            particles[i].size);
    }
}

function loadGame() {
    let savedGame = getItem('savedGame');
    if (savedGame) {
        playingSavedGame = true;
        let [difficulty, _score, _timer, board] = savedGame.split(',');
        gameDifficulty = parseInt(difficulty);
        score = parseInt(_score);
        timer = parseFloat(_timer);
        letterGridFromString(board);
    }
}

function saveGame() {
    let boardString = letterGridToString();
    let gameString = gameDifficulty + ',' + score + ',' + timer + ',' + boardString;
    storeItem('savedGame', gameString);
}

function eraseSaveGame() {
    removeItem('savedGame');
}

function tryLoadSaveGame() {
    let haveSave = getItem('savedGame');
    if (haveSave) {
        loadGame();
        haveSavedGame = true;
        playingSavedGame = true;
    }
    else
    {
        haveSavedGame = false;
    }
}

function doMainMenu() {

    fill(0, 10);
    rect(0, 0, gameWidth, gameHeight);
    // main menu is active
    drawTitle();
    drawDifficulties();
    showResume();
    // handle mouse clicks
    handleMainMenuMouse();
}

function showResume() 
{
    if (!haveSavedGame) return;
    let x = gameWidth / 2;
    let y = gameHeight - gridSize + gridSize / 2;
    let selected;
    if (mouseY > gridSize * 7) selected = true;
    if (selected) {
        fill(255);
        stroke(180, 150);
        strokeWeight(3);
        text('resume', x, y);
    }
    fill(textColor);
    noStroke();
    text('resume', x, y);
    if (selected) {
        fill(255, 160);
        text('resume', x, y);
    }
}

function loadHighscores() {
    let highscoreString = getItem('highscores');
    if (!highscoreString) {
        storeItem('highscores', '0,0,0,0');
        highscoreString = '0,0,0,0';
    }
    highScores = highscoreString.split(',').map(x => int(x));
}

function saveHighscores() {
    let highscoreString = highScores.join(',');
    storeItem('highscores', highscoreString);
}

function handleMainMenuMouse() {
    let selected;
    let resumeSelected;
    if (mouseY > gridSize * 2 && mouseY < gridSize * 7) {
        selected = Math.floor((mouseY - gridSize) / gridSize) - 1;
    }
    if (mouseY > gridSize * 7) {
        resumeSelected = true;
    } 
    else 
    {
        resumeSelected = false;
    }
    if (!mainMenuNeedUnclick && mouseIsPressed) {
        mainMenuClickTimer += deltaTime;
        fill(255, 20);
        rect(0, 0, gameWidth, gameHeight);
    } else {
        mainMenuClickTimer = 0;
    }
    if (mainMenuClickTimer > 200) {
        if (!(mouseY > gridSize * 2 && mouseY < gridSize * 8))
        {
            mainMenuClickTimer = 0;
            return;
        }
        if (resumeSelected)
        {
            tryLoadSaveGame();
            highlightLine.clear();
            highlightLine.removeAllPoints();
            gameState = GameStates.Countdown;
            return;
        }
        else
        {
            // select the difficulty from our array
            playingSavedGame = false;
            resetGame();
            gameDifficulty = selected;
            timer = 1000 * 60 * difficulties[gameDifficulty].minutes;
            gameState = GameStates.Countdown;
            return;
        }
    }

}

function drawDifficulties() {
    textAlign(CENTER, CENTER);
    textSize(gridSize);
    let selected;
    if (mouseY > gridSize * 2 && mouseY < gridSize * 7) {
        selected = Math.floor((mouseY - gridSize) / gridSize) - 1;
    }
    for (let i = 0; i < 5; i++) {
        let difficulty = difficulties[i];
        let x = gameWidth / 2;
        let y = (i + 2) * gridSize + gridSize / 2;
        if (i === selected) {
            fill(255);
            stroke(180, 150);
            strokeWeight(3);
            text(difficulty.name, x, y);
        }
        fill(textColor);
        noStroke();
        text(difficulty.name, x, y);
        if (i === selected) {
            fill(255, 160);
            text(difficulty.name, x, y);
        }
    }   
}

function drawTitle() {
    textAlign(CENTER, CENTER);
    textSize(gridSize);
    fill(textColor);
    noStroke();
    text('hemhaw', gameWidth / 2, gridSize / 2 + gridSize);
}

function doIntro() {
    // have 6 rows of random letters, make sure we can
    // spell hemyhaw with them, shuffle them up by 
    // running them backwards a couple times, then
    // shuffle them forward so that it says hemhaw
    // and tylerw
    introTimer += deltaTime;
    drawTitle();
    // // get position within screen space
    // let x = random(gameWidth + 50) - 25;
    // let y = random(gameHeight + 50) - 25;
    // text("hemhaw", x, y);
    if (introTimer > introLength) {
        gameState = GameStates.MainMenu;
    }
}

function runLockedTiles() {
    for (let j = animatedLockedTiles.length - 1; j>=0; j--) {
        animatedLockedTiles[j][2] -= deltaTime;
        let t = animatedLockedTiles[j];
        let life = t[2];
        if (life < 0) {
            animatedLockedTiles.splice(j, 1);
        }
    }
}

function drawLockedTiles() {
    // draw locked tiles
    for (let j = 0; j < lockedTiles.length; j++) {
        let [x, y] = lockedTiles[j];
        drawLockedTile(x, y);
    }

    // draw animated locked tiles
    for (let j = 0; j < animatedLockedTiles.length; j++) {
        let [x, y, life, maxLife] = animatedLockedTiles[j];
        drawAnimatedLockedTile(x, y, life, maxLife);
    }
}

function drawAnimatedLockedTile(x, y, life, maxLife) {
    let percent = life / maxLife;
    let realX = (x + 1) * gridSize;
    let realY = (y + 1) * gridSize;
    let lockedTileColor = 0;

    strokeWeight(4);
    if (gridColor === '#000000') {
        lockedTileColor = 255;
    }
    else
    {
        lockedTileColor = 0;
    }
    fill(lockedTileColor, 160 * percent);
    stroke(lockedTileColor, 180 * percent);
    let shrink = map(life, 0, maxLife, 0, 1);
    let xShrink;
    let yShrink;
    if (shrink < 0.5) {
        xShrink = shrink * 2;
        yShrink = 0;
    } else {
        xShrink = 1;
        yShrink = (shrink - 0.5) * 2;
    }
    let xTopLeft = realX + (gridSize / 2) - (gridSize / 2) * xShrink;
    let yTopLeft = realY + (gridSize / 2) - (gridSize / 2) * yShrink;
    let width = gridSize - (gridSize * (1 - xShrink));
    let height = gridSize - (gridSize * (1 - yShrink));
    rect(xTopLeft, yTopLeft, width, height);
    
    noFill();
    strokeWeight(gridSize / 4);
    stroke(lockedTileColor, 70 * shrink);
    circle(realX + gridSize / 2, realY + gridSize / 2, gridSize * 4 * (1 - shrink));

}

function drawLockedTile(x, y) {
    fill(0, 160);
    stroke(0, 180);
    strokeWeight(4);
    if (gridColor === '#000000') {
        fill(255, 160);
        stroke(255, 180);
    }
    rect((x + 1) * gridSize, (y + 1) * gridSize, gridSize, gridSize);
}

function makeLockedTiles() {
    let randomLockChance = random();
    if (randomLockChance < lockedTilePercentage)
    {
        if (lockedTiles.length >= maxLockedTiles) return;
        let x = floor(random(0, 5));
        let y = floor(random(0, 5));
        lockedTiles.push([x, y]);
    }
}

function removeLockedTiles(trail) {
    // drop locked tiles on the board
    for (let i = 0; i < trail.length; i++)
    {
        let [x, y] = trail[i];
        for (let j = lockedTiles.length - 1; j >= 0; j--)
        {
            let [_x, _y] = lockedTiles[j];
            if (_x === x && _y === y)
            {
                lockedTiles.splice(j, 1);
                // we also create an animated tile here
                let randomLife = random(350, 550);
                let tile = [_x, _y, randomLife, randomLife];
                animatedLockedTiles.push(tile);
            }
        }
    }
}

function drawBonusTile(bonusTypeTile, gridX, gridY, bonusTime) {
    textAlign(CENTER, CENTER);
    // let outlineColor;
    // let fillColor;
    let realX = gridX + 1;
    let realY = gridY + 1;
    let bonusText;
    switch (bonusTypeTile) 
    {
        case BonusTileType.TripleLetter:
            outlineColor = '#0000FF';
            fillColor = '#4DA5B9';
            bonusText = '3L';
            break;
        case BonusTileType.DoubleLetter:
            outlineColor = '#0000FF';
            fillColor = '#B9D6D2';
            bonusText = '2L';
            break;
        case BonusTileType.TripleWord:
            outlineColor = '#FF0000';
            fillColor = '#FD462E';
            bonusText = '3W';
            break;
        case BonusTileType.DoubleWord:
            outlineColor = '#FF0000';
            fillColor = '#F0BAAC';
            bonusText = '2W';
            break;
    }
    let alph = 140;
    if (bonusTime < 150)
    {
        alph = map(bonusTime, 0, 100, 0, 140);
        strokeWeight(2);
    }
    else
    {
        alph += sin(bonusTime * 0.005) * 30;
        strokeWeight(2 + cos(bonusTime * 0.0001) * 2);

    }
    let outlineClr = color(outlineColor);
    outlineClr.setAlpha(alph);
    let fillClr = color(fillColor);
    fillClr.setAlpha(alph);
    stroke(outlineClr);

    fill(color(fillClr));
    rect(realX * gridSize, realY * gridSize, gridSize, gridSize);

    strokeWeight(2);
    fill(0, 130);
    let gridEigth = gridSize / 8;
    textSize(gridSize / 6);
    text(bonusText, 
        realX * gridSize + gridEigth + 2,
        (realY + 1) * gridSize - gridEigth);
}

function drawAnimatedBonusTiles() {
    for (let i = 0; i < animatedBonusTiles.length; i++) 
    {
        let [bonusType, bonusX, bonusY, bonusTime, bonusTarget] = animatedBonusTiles[i];
        drawAnimatedBonusTile(bonusType, bonusX, bonusY, bonusTime, bonusTarget);
    }
}

function drawAnimatedBonusTile(bonusTypeTile, gridX, gridY, bonusTime, bonusTarget) {
    // we draw a square and change the color based on the time left
    // let outlineColor;
    let fillColor;
    switch (bonusTypeTile) 
    {
        case BonusTileType.TripleLetter:
            outlineColor = '#0000FF';
            fillColor = '#4DA5B9';
            break;
        case BonusTileType.DoubleLetter:
            outlineColor = '#0000FF';
            fillColor = '#B9D6D2';
            break;
        case BonusTileType.TripleWord:
            outlineColor = '#FF0000';
            fillColor = '#FD462E';
            break;
        case BonusTileType.DoubleWord:
            outlineColor = '#FF0000';
            fillColor = '#F0BAAC';
            break;
    }
    let alphaAmt = map(bonusTime, bonusTarget, 0, 80, 0);
    let fillClr = color(fillColor);
    fillClr.setAlpha(alphaAmt);
    noStroke();
    fill(fillClr);
    let realX = (gridX + 1) * gridSize;
    let realY = (gridY + 1) * gridSize;
    rect(0, realY, width, gridSize);
    rect(realX, 0, gridSize, height);
}

function runAnimatedBonusTiles() {
    for (let i = animatedBonusTiles.length - 1; i >= 0; i--)
    {
        let [bonusType, bonusX, bonusY, bonusTime, bonusTarget] = animatedBonusTiles[i];
        bonusTime -= deltaTime;
        animatedBonusTiles[i][3] = bonusTime;   // write back to tile
        if (bonusTime <= 0)
        {
            animatedBonusTiles.splice(i, 1);
        }
    }
}

function runBonusTiles() {
    for (let i = bonusTiles.length - 1; i >= 0; i--)
    {
        let [bonusType, bonusX, bonusY, bonusTime] = bonusTiles[i];
        bonusTime -= deltaTime;
        bonusTiles[i][3] = bonusTime;   // write back to tile
        if (bonusTime < 0)
        {
            bonusTime = 0;
            bonusTiles.splice(i, 1);
        }
    }
}

function drawBonusTiles() {
    for (let i = 0; i < bonusTiles.length; i++) 
    {
        let [bonusType, bonusX, bonusY, bonusTime] = bonusTiles[i];
        if (bonusTime > 0)
        {    
            drawBonusTile(bonusType, bonusX, bonusY, bonusTime);
        }
    }
}

function makeBonusTiles() {
    // on every frame, we have a small chance to generate a bonus tile
    let chance = Math.random() * 100;
    let extraBonus = Math.random();
    if (chance > wordBonusPercentage + letterBonusPercentage) return;
    // find a place to put the tile
    let xGuess; 
    let yGuess; 
    while (true)
    {
        xGuess = floor(Math.random() * 5);
        yGuess = floor(Math.random() * 5);
        let emptySpace = true;
        for (let i = 0; i < bonusTiles.length; i++)
        {
            let [bonusType, bonusX, bonusY, bonusTime] = bonusTiles[i];
            if (bonusX == xGuess && bonusY == yGuess)
            {
                emptySpace = false;
                break;
            }
        }
        if (emptySpace)
        {
            break;
        }
    }
    // OK, now we have a place to put the tile
    let tileType;
    let lifeSpan;

    if (chance < wordBonusPercentage)
    {
        if (extraBonus < 0.33)
        {
            tileType = BonusTileType.TripleWord;
            lifeSpan = 7500;
        }
        else
        {
            tileType = BonusTileType.DoubleWord;
            lifeSpan = 15000;
        }
    }
    else if (chance < wordBonusPercentage + letterBonusPercentage)
    {
        if (extraBonus < 0.33)
        {
            tileType = BonusTileType.TripleLetter;
            lifeSpan = 10000;
        }
        else
        {
            tileType = BonusTileType.DoubleLetter;
            lifeSpan = 20000;
        }
    }
    // continue
    bonusTiles.push([tileType, xGuess, yGuess, lifeSpan]);
}

function setup() { 
    frameRate(60);
    gridSize = Math.min(windowWidth / 7, windowHeight / 8) * 0.95;
    gameWidth = int(7 * gridSize);
    gameHeight = int(8 * gridSize);
    cnv = createCanvas(gameWidth, gameHeight);
    centerCanvas();
    makeLetterArray();
    trie = new Trie();
    populateTrie();
    let tryLoadPalette = getItem('palette');
    if (tryLoadPalette !== null) 
    {
        loadPalette(tryLoadPalette);
    }
    else 
    {
        loadRandomPalette();
    }
    loadHighscores();
    tryLoadSaveGame();
    printConsoleGreeting();
    highlightLine = new HighlightLine();
    introTimer = 0;
    background(0);
    gameState = GameStates.Intro;
} 

function printConsoleGreeting()
{
    console.log("hemhaw");
    console.log("Tyler Weston, February 2022, https://github.com/tylerweston/hemhaw");
}

function populateTrie() {
    // Get the word list and build out the trie 
    let listOfWords = wordlist();
    for (let i = 0; i < listOfWords.length; i++) {
        trie.add(listOfWords[i]);
    }
}

function loadRandomPalette() {
    // Get a new random palette and save it
    let randomPaletteIndex = floor(random(0, palettes.length));
    let randomPalette = palettes[randomPaletteIndex];
    [backgroundColor, correctColor, highlightedSquareColor, textColor, gridColor] = randomPalette;
    if (random() < 0.5)
    {
        [backgroundColor, gridColor] = [gridColor, backgroundColor];
    }
    storeItem('palette', randomPaletteIndex);
}

function loadPalette(index) {
    let palette = palettes[index];
    [backgroundColor, correctColor, highlightedSquareColor, textColor, gridColor] = palette;
}

function doCountdown() {
    // Countdown to the start of the game
    drawBackground();
    drawLetterArray();

    drawOutlines();


    drawArrows();
    drawUI();
    if (mainCountdown <= 0)
    {
        gameState = GameStates.MainGame;
        return;
    } 
    mainCountdown -= deltaTime;



    let secs_left = floor(mainCountdown / 1000) + 1;
    if (secs_left >= 0)
    {
        let t = floor(mainCountdown / 1000) + 1;
        if (secs_left === 0)
            t = "GO!";
        textSize(gridSize * 3);
        textAlign(CENTER, CENTER);
        fill(255, 150);
        strokeWeight(8);
        stroke(255, 80);
        text(t, gameWidth / 2, gameHeight / 2);
        fill(textColor);
        if (secs_left === 0)
            fill(255);
        stroke(0);
        strokeWeight(2);
        text(t, gameWidth / 2, gameHeight / 2);  
        if (mainCountdown % 1000 > 800)
        {
            let extraB = map(mainCountdown % 1000, 1000, 800, 255, 0);
            fill(255, extraB);
            noStroke();
            text(t, gameWidth / 2, gameHeight / 2);
        }
    }
}

function doMainGame() {
    runTimers();
    runParticles();
    runBonusTiles();
    runAnimatedBonusTiles();
    runLockedTiles();
    highlightLine.updateThreads();

    makeBonusTiles();
    makeLockedTiles();


    // Draw Layers
    drawBackground();
    drawLetterArray();

    drawOutlines();


    drawArrows();

    drawHighlights();
    highlightClickTrail();
    // drawHighlightLine();
    highlightLine.draw();
    drawAnimatedBonusTiles();
    drawCurrentWord();
    drawUI();
    drawScoreSlider();
    drawShading();
    drawParticles();
    checkExitGame();
}

function checkExitGame() {
    if (gameState !== GameStates.MainGame) return;
    if (!mouseIsPressed || mouseButton != LEFT) 
    {
        exitToMainMenuTimer = 0;
        return;
    }
    if (mouseX > gameWidth - gridSize / 2 && mouseY < gridSize / 2) {
        fill(0, map(exitToMainMenuTimer, 0, 500, 0, 180));
        noStroke();
        rect(0, 0, gameWidth, gameHeight);
        exitToMainMenuTimer += deltaTime;
        if (exitToMainMenuTimer > 500) {
            if (gameDifficulty == 4)
            {
                mainMenuClickTimer = 0;
                mainMenuNeedUnclick = true;
                exitToMainMenuTimer = 0;
                resetGame();
                gameState = GameStates.MainMenu;
            }
            else
            {
                // TODO: If we have a saved game, we want to confirm
                // overwriting it!
                saveGame();
                haveSavedGame = true;
                gameState = GameStates.MainMenu;
            }
        }
    }
    else
    {
        exitToMainMenuTimer = 0;
    }
}

function draw() { 
    switch (gameState) {
        case GameStates.Intro:
            doIntro();
            break;
        case GameStates.MainMenu:
            doMainMenu();
            break;
        case GameStates.Countdown:
            doCountdown();
            break;
        case GameStates.MainGame:
            doMainGame();
            break;
        case GameStates.EndGame:
            gameOver();
            break;
    }
}

function drawDeBroglie() {
    // adapted from
    // https://beetrandahiya.github.io/ChelseaJS-docs/examples/debroglie_rainbow.html
    deBroglieTimer += deltaTime;
    colorMode(HSB);
    let t = deBroglieTimer / 20;
    if (deBroglieTimer > 1000000) {
        deBroglieTimer = 0;
    }
    for(j = 0; j < 7; j++)
    {
        for(i = 0; i <= 360; i += 3)
        {
            r = (gameWidth/3)+(gameWidth/2)*sin(radians(10*i+t+7*j))*sin(radians(10*i+t+7*j));
            y = r*sin(radians(i));
            x = r*cos(radians(i));
            y = gameHeight/2-y;
            x = gameWidth/2+x;
            noStroke();
            fill(color(30 * j, 255, 150, 200));
            circle(x, y, 25, 25);
        }
    }
    colorMode(RGB);
}

function drawShading() {
    noFill();
    stroke(0, 50);
    strokeWeight(8);
    rect(gridSize, gridSize, gridSize * 5, gridSize * 5);
}

function checkStillClickedArrow()
{
    let xClicked = originalArrowX;
    let yClicked = originalArrowY;
    return  isMouseWithinSquare(xClicked, yClicked) && mouseIsPressed;
}

function isMouseWithinSquare(x, y) {
    let gridX = floor(mouseX / gridSize);
    let gridY = floor(mouseY / gridSize);
    return gridX === x && gridY === y;
}

function runTimers() {
    // TODO: Refactor these clocks, they can be classes
    // smoothClock will run in all game modes, run up, and
    // reset at very large intervals. This can be used to run
    // any animation timers.
    smoothClock += deltaTime;
    if (gameState === GameStates.MainGame) {
        totalTimePlayed += deltaTime;
    }
    if (gameDifficulty !== 4)   // don't countdown in unlimited mode
        timer -= deltaTime;
    if (doingSlide) {
        slidingTimer += deltaTime;
        if (slidingTimer >= slidingMaxTime) {
            slideLine(rowSliding, colSliding, slidingDirection);
            slidingTimer = 0;
            // if we're still clicking over the arrow, keep sliding
            if (checkStillClickedArrow()) {

            }
            else
            {
                doingSlide = false;
                rowSliding = false;
                colSliding = false;
            }
        }
    }
    if (gameDifficulty !== 4 && timer <= 0)
    {
        // this is fired once so we can store high score here
        finalWordCheck();
        if (score > highScores[gameDifficulty])
        {
            gotNewHighscore = true;
            highScores[gameDifficulty] = score;
            saveHighscores();
        }
        timer = 0;
        if (mouseIsPressed && mouseButton === LEFT) 
        {
            eatGameoverClickFlag = true;
        }
        //isGameOver = true;
        if (playingSavedGame)
        {
            eraseSaveGame();
        }
        gameState = GameStates.EndGame;
        deBroglieTimer = 0;
    }
    highlightCounter += deltaTime;
    if (highlightCounter > maxHightlightTime) {
        savedTrail = [];
        savedWord = null;
        highlightCounter = 0;
        highlightColor = '#000000';
    }
    scrollTimer += deltaTime;
    if (scrollTimer > maxScrollTimer) {
        scrollTimer = 0;
        scoreJustAdded = false;
    }
}

function gameOver()
{
    // show a game over screen with final score, high score
    // and option to start again
    fill(0, 10);
    rect(0, 0, gameWidth, gameHeight);
    if (gotNewHighscore)
    {
        drawDeBroglie();
        textSize(gridSize);
        fill(color(textColor));
        stroke(0);
        strokeWeight(1);
        text('new high score!', gameWidth / 2, gridSize);
    }

    textSize(gridSize);
    textAlign(CENTER, CENTER);
    stroke(color(backgroundColor));
    fill(color(textColor));
    strokeWeight(2);
    let totalTimeSecondsRaw = floor(totalTimePlayed / 1000);
    let totalTimeMinutes = floor(totalTimeSecondsRaw / 60);
    let totalTimeSeconds = floor(totalTimeSecondsRaw % 60);
    let totalTimeString = totalTimeMinutes + ':' + nf(totalTimeSeconds, 2);
    // need to offer choice of either play again or go to main menu

    if (abs(mouseY - gridSize * 2) < gridSize / 2) 
    { 
        strokeWeight(4);
        stroke(255, 70);
        fill(255)
    }
    else
    {
        strokeWeight(2);
        stroke(0);
        fill(color(textColor));
    }

    text("play again", gameWidth / 2, gridSize * 2);

    if (abs(mouseY - gridSize * 3) < gridSize / 2)
    {
        strokeWeight(4);
        stroke(255, 70);
        fill(255)
    }
    else
    {
        strokeWeight(2);
        stroke(0);
        fill(color(textColor));
    }
    text("main menu", gameWidth / 2, gridSize * 3);
    
    textSize(gridSize / 2);
    stroke(color(backgroundColor));
    fill(color(textColor));
    strokeWeight(2);
    text('total time: ' + totalTimeString + '\nfinal score: ' + score + "\nhigh score: " + highScores[gameDifficulty]+"\n" + difficulties[gameDifficulty].name, gameWidth / 2, gridSize * 5);
    if (mouseIsPressed && mouseButton === LEFT && !eatGameoverClickFlag) {
        gameOverMouseCount += deltaTime;
        if (gameOverMouseCount > 200) {
            // if we are over the play again button, start again
            if (abs(mouseY - gridSize * 2) < gridSize / 2)
            { 
                resetGame();
                gameState = GameStates.Countdown;
            }
            if (abs(mouseY - gridSize * 3) < gridSize / 2)
            { 
                resetGame();
                tryLoadSaveGame();
                mainMenuNeedUnclick = true;
                gameState = GameStates.MainMenu;
            }
        }
        fill(255, 50);
        rect(0, 0, gameWidth, gameHeight);
    }
    if (!mouseIsPressed) {
        gameOverMouseCount = 0;
        // eatGameoverClickFlag = false;
    }
}

function resetGame()
{
    score = 0;
    // base timer on difficulty
    timer = 1000 * 60 * difficulties[gameDifficulty].minutes;//1000 * 60 * startingMinutes;
    
    currentWord = '';
    clickedTrail = [];
    lastClicked = [];
    savedTrail = [];
    highlightLine.clear();
    highlightLine.removeAllPoints();
    highlightCounter = 0;
    highlightColor = '#000000';
    savedWord = '';
    scoreJustAdded = 0;
    scrollTimer = 0;
    gotNewHighscore = false;
    shownNewHighscore = false;
    doingSlide = false;
    rowSliding = false;
    colSliding = false;
    totalTimePlayed = 0;
    bonusTiles = [];
    mainCountdown = 3000;
    mainMenuClickTimer = 0;
    gameOverMouseCount = 0;
    exitToMainMenuTimer = 0;
    smoothClock = 0;
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
    strokeWeight(4);
    stroke(0, 50);
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
    stroke(color(gridColor));
    // get mouse square here and use that to figure out which arrow to illuminate
    // instead of all these calls to isMouseCloseToCenterOfSquare!
    let mouseXGrid = floor(mouseX / gridSize);
    let mouseYGrid = floor(mouseY / gridSize);
    for (let y = 1; y <= 5; y++) {
        let illuminated = mouseIsPressed && doingSlide && mouseYGrid - 1 === rowSliding;
        drawArrow(0, y, 'left', mouseXGrid === 0 && mouseYGrid === y, illuminated);
        drawArrow(6, y, 'right', mouseXGrid === 6 && mouseYGrid === y, illuminated);
    }
    for (let x = 1; x <= 5; x++) {
        let illuminated = mouseIsPressed && doingSlide && mouseXGrid - 1 === colSliding;
        drawArrow(x, 0, 'up', mouseXGrid === x && mouseYGrid === 0, illuminated);
        drawArrow(x, 6, 'down', mouseXGrid === x && mouseYGrid === 6, illuminated);
    }

    noStroke();
    fill(0, 50);
    textAlign(CENTER, CENTER);
    textSize(gridSize / 2);
    text('?', gridSize / 4, gridSize / 4 + 2);
    text('X', gameWidth - gridSize / 4 - 2, gridSize / 4 + 2);  
}

function drawArrow(xPosition, yPosition, direction, selected, extraHighlight) {
    // direction = 'left', 'right', 'up', 'down'
    let realX = xPosition * gridSize;
    let realY = yPosition * gridSize;

    let halfGridsize = gridSize / 2;
    let p1;
    let p2;
    let p3;
    let arrowOffset = gridSize / 16;
    if (direction === 'up' || direction === 'down') {
        if (direction === 'up') {

                p1 = [realX, realY + gridSize - arrowOffset]; 
                p2 = [realX + gridSize, realY + gridSize - arrowOffset]; 
                p3 = [realX + halfGridsize, realY + halfGridsize]; //); 
        }
        if (direction === 'down') {

                p1 = [realX, realY + arrowOffset]; 
                p2 = [realX + gridSize, realY + arrowOffset]; 
                p3 = [realX + halfGridsize, realY + halfGridsize]; 

        }
    } else {
        if (direction === 'left') {

                p1 = [realX + gridSize - arrowOffset, realY]; 
                p2 = [realX + gridSize - arrowOffset, realY + gridSize]; 
                p3 = [realX + halfGridsize, realY  + halfGridsize];
        }
        if (direction === 'right') {

                p1 = [realX + arrowOffset, realY]; 
                p2 = [realX + arrowOffset, realY + gridSize]; 
                p3 = [realX + halfGridsize, realY + halfGridsize];

        }
    }

    // if we are LOCKED, just draw us as dead :(
    let locked = false;
    for (let i = 0; i < lockedTiles.length; i++) {
        // if (lockedTiles[i][0] === xPosition || lockedTiles[i][1] === yPosition) {
        //     locked = true;
        //     break;
        let [_x, _y] = lockedTiles[i];
        if (_x === xPosition - 1 || _y === yPosition - 1) {
            locked = true;
            break;
        }
    }

    if (locked) {
        fill(0, 0, 0, 100);
        noStroke();
        triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
        return;
    }

    if (selected)
    {
        if (extraHighlight)
        {
            noStroke();
            let cx = p1[0] + p2[0] + p3[0];
            cx /= 3;
            let cy = p1[1] + p2[1] + p3[1];
            cy /= 3;
            for (let i = 2; i > 1; i -= 0.3)
            {
                fill(255, 10);

                circle(cx, 
                    cy, 
                    i * gridSize / 1.5 + abs((sin(smoothClock / 750) * (gridSize / 3))));
            }
        }
        fill(color(highlightedSquareColor));
        stroke(180, 60);
        strokeWeight(6);
        triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
        

        if (extraHighlight) {
            fill(255, 120 + cos(smoothClock / 2000) * 20);
            strokeWeight(6 + sin(smoothClock / 1000) * 5);
            stroke(220, 140);
            triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
        }

        stroke(0, 60);
        strokeWeight(2);
        noFill();
        triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
    }
    else
    {
        noFill();
        stroke(50, 40);
        strokeWeight(6);
        triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);

        fill(color(gridColor));
        stroke(0, 60);
        strokeWeight(2);
        triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
    }


}

function drawUI() {
    let displayTimeRaw = floor(timer / 1000);
    let minutes = floor(displayTimeRaw / 60);
    let seconds = displayTimeRaw % 60;
    let displayTime = minutes + ':' + nf(seconds, 2);
    textSize(gridSize / 2);
    textAlign(CENTER, BASELINE);
    noFill();
    strokeWeight(2);
    stroke(180, 30);

    let txt;
    if (gameDifficulty === 4)
    {
        txt = `Score: ${score}`;
    }
    else
    {
        txt = `Score: ${score} Timer: ${displayTime}`;
    }

    text(txt, gameWidth / 2 - 2, gameHeight - gridSize / 8 );
    stroke(0, 30);
    text(txt, gameWidth / 2 + 2, gameHeight - gridSize / 8 + 4);
    stroke(0);
    strokeWeight(2);
    fill(color(textColor));
    text(txt, gameWidth / 2, gameHeight - gridSize / 8 + 2);
}

function drawScoreSlider() {
    // show recently gotten score
    if (scoreJustAdded) {
        textSize(gridSize/2);
        textAlign(LEFT, BASELINE);
        let textLeft = map(scrollTimer, 0, maxScrollTimer, 0, gameWidth);
        stroke(255, 50);
        strokeWeight(4);
        noFill();
        text('+' + scoreJustAdded, textLeft , gameHeight - gridSize / 8);
        strokeWeight(2);
        stroke(0);
        fill(color(textColor));

        text('+' + scoreJustAdded, textLeft , gameHeight - gridSize / 8);
    }
}

function drawHighlights() {
    let highlightColorAlpha = color(highlightColor);
    highlightColorAlpha.setAlpha(map(highlightCounter, 0, maxHightlightTime, 150, 0));
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

        //noStroke();
        stroke(highlightColorAlpha);
        strokeWeight(3);
        fill(highlightColorAlpha);
        text(savedWord.toUpperCase(), gameWidth / 2, 6 * gridSize + gridSize);
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
    // letter grid background
    strokeWeight(3);
    fill(color(gridColor));
    stroke(0, 40);
    rect(gridSize, gridSize, gameWidth - gridSize, gameHeight - gridSize * 2);

    // letter grid shading
    noFill();
    strokeWeight(3);
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            stroke(255, 50);
            rect((x + 1) * gridSize + 2, (y + 1) * gridSize + 2, gridSize, gridSize);
            stroke(0, 50);
            rect((x + 1) * gridSize - 2, (y + 1) * gridSize - 2, gridSize, gridSize);
        }
    }

    // convert mouseX, mouseY to a grid position
    let xSelected = floor((mouseX - gridSize) / gridSize);
    let ySelected = floor((mouseY - gridSize) / gridSize);
    noFill();
    strokeWeight(4);
    stroke(210, 80);
    rect((xSelected + 1) * gridSize + 2, 
        (ySelected + 1) * gridSize + 2, 
        gridSize - 4, gridSize - 4);

    drawBonusTiles();


    // letter grid outline
    noFill();
    stroke(0, 60);
    strokeWeight(2);
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            rect((x + 1) * gridSize, (y + 1) * gridSize, gridSize, gridSize);
        }
    }
    drawLockedTiles();
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
            if (letterFadeGrid[x][y][0] > 0) {
                letterFadeGrid[x][y][0] -= deltaTime;
                let alph = map(letterFadeGrid[x][y][0], 0, letterFadeGrid[x][y][1], 0, 200);
                fill(0, alph);
                noStroke();
                rect((x + 1) * gridSize, (y + 1) * gridSize, gridSize, gridSize);
            }
        }
    }

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

function mousePressed() {
    if (mouseX < gridSize / 2 && mouseY < gridSize / 2) {
        loadRandomPalette();
    }
    if (gameState !== GameStates.MainGame) return;

    // check if we are in the leftmost or rightmost column
    let x = floor(mouseX / gridSize);
    let y = floor(mouseY / gridSize);
    originalArrowX = x;
    originalArrowY = y;
    let gridX = x - 1;
    let gridY = y - 1;
    // TODO: DRY this out. This is a bit better but could still probably be improved
    if (x === 0 && y > 0 && y < 6) 
    {
        rowSliding = gridY;
        slidingDirection = -1;
        doingSlide = true;
    }
    if (x === 6 && y > 0 && y < 6) 
    {
        rowSliding = gridY;
        slidingDirection = 1;
        doingSlide = true;

    }
    if (y === 0 && x > 0 && x < 6) 
    {
        colSliding = gridX;
        slidingDirection = -1;
        doingSlide = true;

    }
    if (y === 6 && x > 0 && x < 6) 
    {
        colSliding = gridX;
        slidingDirection = 1;
        doingSlide = true;
    }
    // check if this row or column is locked
    let locked = false;
    for (let i = 0; i < lockedTiles.length; i++) {
        if (lockedTiles[i][0] === colSliding || lockedTiles[i][1] === rowSliding) {
            locked = true;
            break;
        }
    }
    if (locked) {
        rowSliding = false;
        colSliding = false;
        slidingDirection = 0;
        doingSlide = false;
        return;
    }
    // we are in main game and we just pressed somewhere
    // on the board
    if (x >= 1 && x <= 5 && y >= 1 && y <= 5)
    {
        checkForSquareSelect();
    }
}

function checkForSquareSelect()
{
    [gridX, gridY] = getClosestSquare();
    // check if our last gridPos was the last entry in our clickedTrail and our current grid pos is the 
    // second last entry
    if (clickedTrail.length > 1 &&
        clickedTrail[clickedTrail.length - 2][0] === gridX &&
        clickedTrail[clickedTrail.length - 2][1] === gridY &&
        clickedTrail[clickedTrail.length - 1][0] === lastClicked[0] &&
        clickedTrail[clickedTrail.length - 1][1] === lastClicked[1])
        {
            clickedTrail.pop();
            highlightLine.pop();
            currentWord = currentWord.substring(0, currentWord.length - 1);
            lastClicked = [gridX, gridY];
        }

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
        highlightLine.push([gridX, gridY]);
    }
    lastGridPos = [gridX, gridY];

}

function mouseDragged() {
    if (gameState !== GameStates.MainGame) return;
    if (mouseX < gridSize || 
        mouseY < gridSize || 
        mouseX > gameWidth - gridSize || 
        mouseY > gameHeight - gridSize) 
    {
        // stop the current drag without scoring
        currentWord = '';
        clickedTrail = [];
        highlightLine.clear();
        lastClicked = [];
        return;
    };
    checkForSquareSelect();
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
    return dist < gridSize / 2.5;
}

function getClosestSquare() {
    let realX = floor(mouseX / gridSize);
    let realY = floor(mouseY / gridSize);
    let gridX = realX - 1;
    let gridY = realY - 1;
    return [gridX, gridY];
}

function mouseReleased() {
    // if (gameState === GameStates.EndGame && !eatGameoverClickFlag)
    // {
    //     eatGameoverClickFlag = false;
    //     resetGame();
    //     return;
    // }
    // else
    // {
    //     eatGameoverClickFlag = false;
    // }
    if (gameState === GameStates.EndGame) {
        if (eatGameoverClickFlag)
            eatGameoverClickFlag = false;
    }
    if (gameState === GameStates.MainMenu)
    {
        if (mainMenuNeedUnclick)
            mainMenuNeedUnclick = false;
    }
    if (gameState === GameStates.MainGame)
    {
        doWordCheck();
    }
}

function scoreWordWithBonus(word) {
    let rawScore = scoreWord(word);
    // check each location along the path for a bonus
    for (let i = 0; i < clickedTrail.length; i++) 
    {
        let [x, y] = clickedTrail[i];
        let letter = letterArray[x][y];
        // First apply extra letter bonuses, then word bonuses
        for (let j = 0; j < bonusTiles.length; j++) 
        {
            let [bonusType, bonusX, bonusY, _] = bonusTiles[j];
            if (bonusX === x && bonusY === y) 
            {
                switch (bonusType) 
                {
                    case BonusTileType.TripleLetter:
                        rawScore += (2 * getScore(letter))
                        break;
                    case BonusTileType.DoubleLetter:
                        rawScore += getScore(letter);
                        break;
                }
            }
        }
        // Apply word bonuses
        for (let j = 0; j < bonusTiles.length; j++) 
        {
            let [bonusType, bonusX, bonusY, _] = bonusTiles[j];
            if (bonusX === x && bonusY === y) 
            {
                switch (bonusType) 
                {
                    case BonusTileType.TripleWord:
                        rawScore *= 3;
                        break;
                    case BonusTileType.DoubleWord:
                        rawScore *= 2;
                        break;
                }
            }
        }
    }
    return rawScore;
}

function dropBonuses(trail) {
    // drop bonuses on the board
    for (let i = 0; i < trail.length; i++)
    {
        let [x, y] = trail[i];
        for (let j = bonusTiles.length - 1; j >= 0; j--)
        {
            let [bonusType, bonusX, bonusY, __] = bonusTiles[j];
            if (bonusX === x && bonusY === y)
            {
                bonusTiles.splice(j, 1);
                // we also create an animated tile here
                let randomLife = random(350, 650);
                let tile = [bonusType, bonusX, bonusY, randomLife, randomLife];
                animatedBonusTiles.push(tile);
            }
        }
    }
}

function doWordCheck() {
    let isWord = checkWord(currentWord);
    if (isWord) {
        highlightColor = '#00EE00';
        scoreJustAdded = scoreWordWithBonus(currentWord);
        scrollTimer = 0;
        score += scoreJustAdded;
        timer += scoreJustAdded * 1000 * difficulties[gameDifficulty].secondPerScore;
        removeLetters(clickedTrail);
        dropBonuses(clickedTrail);
        removeLockedTiles(clickedTrail);
        replaceLetters();
        highlightLine.removeAllPoints();
        savedWord = isWord;
    } else {
        highlightColor = '#EE0000';
        savedWord = currentWord;
    }
    // start the highlight
    highlightCounter = 0;
    savedTrail = clickedTrail;


    currentWord = '';
    clickedTrail = [];
    highlightLine.clear();
    lastClicked = [];

}

function finalWordCheck()
{
    let isWord = checkWord(currentWord);
    if (!isWord) return;
    let newScore = scoreWordWithBonus(currentWord);
    score += newScore;
    if (score >= highScores[gameDifficulty])
    {
        gotNewHighscore = true;
        highScores[gameDifficulty] = score;
    }
    currentWord = '';
    clickedTrail = [];
    highlightLine.clear();
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
    // stroke(color(gridColor));
    // fill(color(textColor));
    // text(currentWord, gameWidth / 2, 7 * gridSize + 2);

    // hightlight
    stroke(220, 60);
    fill(0);
    strokeWeight(4);
    text(currentWord, gameWidth / 2 - 1, 7 * gridSize + 1);
    // dark shadow
    stroke(0, 70);
    text(currentWord, gameWidth / 2 + 1, 7 * gridSize + 3);
    // regular letter
    stroke(100, 150);
    strokeWeight(1);
    fill(color(textColor));
    text(currentWord, gameWidth / 2, 7 * gridSize + 2);

}

function highlightClickTrail() {
    // highlight squares
    noStroke();
    let trailColor = color(highlightedSquareColor);
    for (let i = 0; i < clickedTrail.length; i++) {
        //fill(175, map(i, 0, clickedTrail.length, 75, 125));
        trailColor.setAlpha(map(i, 0, clickedTrail.length, 100, 200));
        fill(trailColor);
        let x = clickedTrail[i][0] + 1;
        let y = clickedTrail[i][1] + 1;

        rect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
    }
}

class HighlightThread {
    constructor(trail) {
        this.trail = trail;
        this.lines = [];
    }

    indexToReal(index) {
        return (index + 1) * gridSize + gridSize / 2;
    }

    update(trail) {
        // update the list of thread positions
        this.trail = trail;
        //this.lines = [];
        if (trail.length === 0) return;
        let [oldXoffset, oldYoffset] = [random(-1, 1) * gridSize / 16, 
            random(-1, 1) * gridSize / 16];
        for (let index = 0; index < trail.length - 1; index++) {
            let [x1, y1] = trail[index];
            let [x2, y2] = trail[index + 1];
            [x1, y1] = [this.indexToReal(x1) + oldXoffset, 
                        this.indexToReal(y1) + oldYoffset];
            [x2, y2] = [this.indexToReal(x2), this.indexToReal(y2)];
            let xAmt = random(-1, 1) * gridSize / 16;
            let yAmt = random(-1, 1) * gridSize / 16;
            x2 += xAmt;
            y2 += yAmt;
            oldXoffset = xAmt;
            oldYoffset = yAmt;
            let clr = color(correctColor);
            clr.setAlpha(map(index, 0, trail.length - 1, 50, 80) + random(-10, 10));    
            let line = [x1, y1, x2, y2, clr, random(1, 2)];
            this.lines.push(line);
        }
        // randomly remove some lines
        for (let i = this.lines.length - 1; i >= 0; i--) {
            if (random(0, 1) < 0.3) {
                this.lines.splice(i, 1);
            }
        }
    }

    clear() {
        this.lines = [];
    }

    draw() {
        for (let i = 0; i < this.lines.length; i++) {
            let [x1, y1, x2, y2, color, _strokeWeight] = this.lines[i];
            strokeWeight(_strokeWeight);
            stroke(color);
            line(x1, y1, x2, y2);
        }
    }

}

class HighlightLine {
    constructor(trail) {
        this.trail = trail;
        this.threads = [];
        this.numThreads = 5;
        this.animCounter = 0;
        this.targetFrames = 60;
        this.targetTime = 1000 / this.targetFrames;
        for (let i = 0; i < this.numThreads; i++) {
            this.threads.push(new HighlightThread(trail));
        }
    }

    clear() {
        this.trail = [];
    }

    removeAllPoints()
    {
        for (let i = 0; i < this.numThreads; i++) 
        {
            this.threads[i].clear();
        }
    }

    addThread() {
        // add a thread to our highlight line
        this.threads.push(new HighlightThread(this.trail));
    }

    updateThreads() {
        for (let i = 0; i < this.threads.length; i++) {
            this.threads[i].update(this.trail);
        }
    }

    draw() {
        for (let i = 0; i < this.threads.length; i++) {
            this.threads[i].draw();
        }
    }

    push(location) {
        this.trail.push(location);
        this.updateThreads();
    }

    pop() {
        let val = this.trail.pop();
        this.updateThreads();
        return val;
    }
}

function drawHighlightLine()
{
    highlightLine.draw();
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
 