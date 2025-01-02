import { minify } from './energizer.js';
import { parseDocument } from 'htmlparser2';
import { Pool, RetryAgent } from 'undici';
import { render } from 'dom-serializer';
import { readFile } from 'fs/promises';

const baseURL = 'https://elcinema.com';
const search = ['/ajaxable/search_simple', '/ajaxable/search', '/search/']; // Keeps old(?) endpoints
const agent = new RetryAgent(new Pool(baseURL, { pipelining: 1 }), { maxRetries: 1 });

const options = {
    path: '/',
    method: 'GET',
    query: { q: 'akl' },
    headers: {
        'User-Agent': 'Cinema-Custodian/1',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://custodian.elcinema.com',
    },
}

async function network(length = 10, listen = false) {
    if (listen) {
        agent.on('connect', (origin, targets) => { console.log('CONNECTED', targets.map((_, i) => i)) });
        agent.on('disconnect', (origin, targets) => { console.log('DISCONNECTED', targets.map((_, i) => i)) });
        agent.on('connectionError', (origin, targets) => { console.log('ERROR', targets.map((_, i) => i)) });
        agent.on('drain', (origin, targets) => { console.log('DRAINED', targets.map((_, i) => i)) });
    }

    let start = Date.now();
    let good = 0, bad = 0;
    
    await Promise.all(Array.from({ length }, (_, i) => agent.request(options).then(async response => {
        response.body.dump();
        console.log(`<Request #${i.toString().padStart(3, '0')}> (Code ${response.statusCode} ${response.statusCode < 400 ? (good++, 'GOOD') : (bad++, 'FAIL')}) +${Date.now() - start}ms`);
    }))).catch(error => {
        console.error(error.message);
    });
    
    const total = good + bad;
    const time = (Date.now() - start);
    console.log(`\nTotal: ${total} in ${time / 1000} sec - ${time / (total || 1)} ms/req | Good: ${good} - ${good * 100 / (total || 1)}% | Bad: ${bad} - ${bad * 100 / (total || 1)}%`);
}

const response = JSON.parse(await readFile('./http_responses/Simple Search.json', 'utf-8'));
const hypertext = response.slice(0, -1).join('');
const document = parseDocument(minify(hypertext));

// for (let item of document.children) {
//     const {
//         "data-id": id,
//         "data-entity": entity,
//         "data-text": text,
//     } = item.attributes;
    
//     const leaves = item.select('*');
// }
console.log([...document.descendants()].length);
console.log(document.select(node => node.type === 'text').map(node => node.data).join('\n\n\n'));

// const match = document.select('*', { depth: false, skip: 3, last: 4 });
// console.log(match.map(element => element.name));
// console.log(match.length);
