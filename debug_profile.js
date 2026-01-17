const https = require('https');

// const url = 'https://alfa-leetcode-api.onrender.com/trojanmocx/dashboardalfa'; // This failed
const url = 'https://alfa-leetcode-api.onrender.com/trojanmocx/leetcode/stats'; // Try this one? Or /userProfile/trojanmocx

const endpoints = [
    '/trojanmocx/dashboardalfa',
    '/userProfile/trojanmocx',
    '/trojanmocx/solved',
    '/trojanmocx/contest'
];

const checkEndpoint = (path) => {
    const fullUrl = `https://alfa-leetcode-api.onrender.com${path}`;
    console.log(`Checking ${fullUrl}...`);
    https.get(fullUrl, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log(`[${path}] Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log(`[${path}] Data snippet:`, data.substring(0, 100));
            }
        });
    }).on('error', e => console.error(e.message));
};

endpoints.forEach(ep => checkEndpoint(ep));
