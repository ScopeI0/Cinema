import { NodeWithChildren } from 'domhandler';
import { compile } from 'css-select';

const clean = /(?<=>)\s+|\s+(?=<)/g;
const sweep = /(?<=>)\s+(?=<)/g;

/**
 * Remove problematic redundant whitespace between HTML tags.
 */
export function minify(data, strip = true) {
    return data.replace(strip ? clean : sweep, '');
}

/**
 * Performant lazy depth-first tree traverser.
 */
export function *posterity(root) {
    const stack = [{ parent: root, index: 0 }];

    while (stack.length) {
        const bucket = stack[stack.length - 1]; // Peek
        const { parent: { children: branch } , index } = bucket;
        if (++bucket.index === branch.length) above.pop();
        
        const node = branch[index];
        yield node;
        const children = node.children;
        if (children?.length && (children.length !== 1 || children[0].type !== 'text')) stack.push({ parent: node, index: 0 });
    }
}

/**
 * Performant lazy breadth-first tree traverser.
 */
export function* descendants(root, { skip = 0, last = Infinity } = {}) {
    let level = 0;
    let queue = [root];

    while (queue.length && level++ < last) {
        const breadth = queue;
        queue = [];

        for (let i = 0; i < breadth.length; i++) {
            const branch = breadth[i].children;

            for (let j = 0; j < branch.length; j++) {
                if (level > skip) yield branch[j];
                const children = branch[j].children;
                if (children?.length && (children.length !== 1 || children[0].type !== 'text')) queue.push(branch[j]);
            }
        }
    }
}

/**
 * Node sieve, applies query on every node.
 */
export function select(generator, query, { limit = Infinity } = {}) {
    if (typeof query !== 'function') query = compile(query);
    const match = [];

    for (const node of generator) {
        if (query(node)) {
            match.push(node);
            if (match.length === limit) break;
        }
    }

    return match;
}

Object.assign(NodeWithChildren.prototype, {
    /**
     * Node sieve, applies query on every node.
     */
    select(query, { depth = true, limit = Infinity, ...options }) {
        return select((depth ? posterity : descendants)(this, options), query, { limit });
    },
});

/**
TODO Posterity breadth control.
TODO Descendants children & leaves facility.
*/
