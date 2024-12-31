import { NodeWithChildren } from 'domhandler';
import { compile } from 'css-select';
import { parseDocument } from 'htmlparser2';

/** @typedef {import('htmlparser2').Options} Options */

/**
 * Minifies the data, parses the markup, returns the resulting document.

 * @param {string} data The data that should be parsed.
 * @param {Options} [options] Optional options for the parser and DOM handler.
 */
export function Soup(data, options) {
    return parseDocument(data.replace(/(?<=>)\s+|\s+(?=<)/g, ''), options);
}

Object.assign(NodeWithChildren.prototype, {
    /**
     * Node positional indicator.
     * 
     * @returns {boolean} Whether the node matches the leaf criteria.
     */
    isLeaf() {
        return !this.children.length || this.children.length === 1 && this.children[0].type === 'text';
    },

    /**
     * Performant DOM traverser.
     * 
     * @param {boolean} [depth=true] Traversal mode, defaults to breadth-first, falls back to depth-first.
     * @param {number} [limit=-1] Maximum breadths.
     * @returns {IterableIterator<Node>} Node generator.
     */
    *descendants(breadth = true, limit = -1) {
        let above = [this];
        const extend = breadth ? 'push' : 'unshift';

        while (above.length && limit--) {
            const ground = above;
            above = [];

            for (let i = 0; i < ground.length; i++) {
                const branch = ground[i].children;

                for (let j = 0; j < branch.length; j++) {
                    yield branch[j];
                    if (branch[j].children?.length) above[extend](branch[j]);
                }
            }
        }
    },

    /**
     * DOM sieve, applies criteria on every node.
     * 
     * @param {string|function(Node): boolean} query Node qualification criteria.
     * @param {number} [limit=-1] Maximum matches.
     * @param {IterableIterator<Node>} [generator=this.descendants()] Node source.
     * @returns {Node[]} Matching nodes.
     */
    select(query, limit = -1, generator = this.descendants()) {
        if (typeof query !== 'function') query = compile(query);
        const match = [];

        for (const node of generator) if (query(node) && match.push(node), match.length === limit) break;
    
        return match;
    },
});

/*
 * Contents Property
get contents() {
    return this.children.filter(child => child.data !== '\n');
}
*/

/*
 * Descendants Candidate
function* descendants(self, breadth = true) {
    let below  = [self.children];
    const extend = breadth ? 'push' : 'unshift';

    while (below.length) {
    const ground = below;
    below = [];

        for (let i = 0; i < ground.length; i++) {
            const branch = ground[i];
            
            for (let j = 0; j < branch.length; j++) {
                yield branch[j];
                const children = branch[j].children;
                if (children?.length) below[extend](children);
            }
        }
    }
}
*/

/*
TODO Improve depth-first by iterating backwards, either save starting indices in a stack or push in batches.
TODO Absolute solution: distinct next and nextSibling node attributes.
TODO Select can be made static.
TODO Node type can be made more specific.
*/
