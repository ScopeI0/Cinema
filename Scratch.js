import * as Energizer from './lib/energizer.js';
import { parseDocument } from 'htmlparser2';
import { readFile } from 'fs/promises';
import { render } from 'dom-serializer';

/**
 * Posterity Candidate
 */
function* posterity(root) {
    const stack = [{ branch: root.children, index: 0 }];

    while (stack.length) {
        const bucket = stack[stack.length - 1]; // Peek
        const { branch, index } = bucket;
        if (++bucket.index === branch.length) stack.pop();
        
        const node = branch[index];
        yield node;
        const children = node.children;
        if (children?.length) stack.push({ branch: children, index: 0 });
    }
}

/**
 * Descendants candidate
 */
function* descendants(root, breadth = true, last = Infinity) {
    let below  = [root.children];
    const extend = breadth ? 'push' : 'unshift';

    while (below.length && last--) {
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

function isLeaf(node) {
    return !node.children.length || node.children.length === 1 && node.children[0].type === 'text';
}

function difference(p, q) {
    q = new Set(q);
    return p.filter(x => !q.has(x));
}

const document = parseDocument((await readFile('./lib/http_responses/Home.html', 'utf-8')));
let generator = [];
let count = 0;

const bound = 1000;
const start = performance.now();
for (let i = 0; i < bound; i++) {
    // generator = posterity(document); // 120
    // generator = descendants(document); // 140
    // generator = document.posterity({ last: 3, inclusive: true });
    generator = document.descendants({ inclusive: true });

    for (const node of generator) count++;
}
console.log(`Nodes: ${count / bound}`);
console.log(`Time: +${performance.now() - start | 0}ms`);
console.log(`Memory: ${Object.values(process.memoryUsage()).reduce((sum, value ) =>  sum + value , 0)}`);

generator = document.descendants({ inclusive: true, leaf: true });
// for (let i = 0; i < 50; i++) console.log(i, render(generator.next().value));

// difference([...descendants(document)], [...document.descendants({ inclusive: true })]).forEach(x => console.log(x.type));
