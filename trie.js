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
        let stack = [[this.root, 0, '']];

        while (stack.length > 0) {
            let [current, index, prefix] = stack.pop();
            if (index === word.length && current.isEnd) return prefix;
            let char = word[index];
            if (char === '*') {
                for (let child in current.children) {
                    stack.push([current.children[child], index + 1, prefix + child]);
                }
            } else if (current.children[char]) {
                stack.push([current.children[char], index + 1, prefix + char]);
            }
        }
        return false;
    }
}

