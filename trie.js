class TrieNode {
    constructor(key) {
        this.key = key;
        this.children = {};
        this.isEnd = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode('');
    }

    add(word) {
        let current = this.root;
        for (let i = 0; i < word.length; i++) {
            let char = word[i];
            if (!current.children[char]) {
                current.children[char] = new TrieNode(char);
            }
            current = current.children[char];
        }
        current.isEnd = true;
    }

    search(word) {
        // Search for a word and allow the use of '*' as a wildcard
        // Maintain a stack of nodes to be checked for a match and add 
        // all children of a node if we reach a wildcard.
        // Note, when we add the children, we shuffle the order so that
        // using wildcards will not always result in the same word.
        let stack = [[this.root, 0, '']];

        while (stack.length > 0) {
            let [current, index, prefix] = stack.pop();
            if (index === word.length && current.isEnd) return prefix;
            let char = word[index];
            if (char === '*') {
                let shuffledArray = [];
                for (let child in current.children) {
                    shuffledArray.push([current.children[child], index + 1, prefix + child]);
                }
                shuffleArray(shuffledArray);
                stack = stack.concat(shuffledArray);
            } else if (current.children[char]) {
                stack.push([current.children[char], index + 1, prefix + char]);
            }
        }
        return false;
    }

    getRandomWord(length) 
    {
        // create a string of length *s
        let word = '';
        for (let i = 0; i < length; i++) {
            word += '*';
        }
        return this.search(word)

    }
}

// Durstenfeld shuffle
// from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}