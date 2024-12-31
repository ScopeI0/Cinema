import { Soup } from './Energizer.js';
import { parseDocument } from 'htmlparser2';
import { Pool } from 'undici';
import { readFile } from 'fs/promises';

const baseURL = 'https://elcinema.com';
const search = ['/ajaxable/search_simple', '/ajaxable/search', '/simple_search/', '/search/']; // Keeps old(?) endpoints
const clients = new Pool(baseURL, { connections: 5, pipelining: Infinity });

const options = {
    path: search[0],
    method: 'GET',
    query: {
        q: 'akl'
    },
    headers: {
        'User-Agent': 'Cinema-Custodian/1',
    },
}

let start = Date.now();
let good = 0, bad = 0;

await Promise.all(Array.from({ length: 10 }, (_, i) => clients.request(options).then(async response => {
    response.body.dump();
    console.log(`<Request #${i.toString().padStart(3, '0')}> (Code ${response.statusCode} ${response.statusCode < 400 ? (good++, 'GOOD') : (bad++, 'FAIL')}) +${Date.now() - start}ms`);
})));

const total = good + bad;
const time = (Date.now() - start);
console.log(`\nTotal: ${total} - +${time / 1000}s - ${time / total} ms/req | Good: ${good} - ${good * 100 / total}% | Bad: ${bad} - ${bad * 100 / total}%`);
