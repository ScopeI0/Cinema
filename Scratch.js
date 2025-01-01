import * as Energizer from './Energizer.js';
import { parseDocument } from 'htmlparser2';
import { readFile } from 'fs/promises';

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
function* descendants(root, breadth = true) {
    let below  = [root.children];
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

const document = parseDocument(await readFile('./http_responses/Home.html', 'utf-8'));
let generator = [];
let count = 0;

const start = Date.now();
for (let i = 0; i < 1000; i++) {
    // generator = posterity(document); // 120
    // generator = descendants(document); // 140

    for (const node of generator) count++;
}
console.log(`Nodes: ${count}`);
console.log(`Time: +${Date.now() - start}ms`);
console.log(`Memory: ${Object.values(process.memoryUsage()).reduce((sum, value ) =>  sum + value , 0)}`);
