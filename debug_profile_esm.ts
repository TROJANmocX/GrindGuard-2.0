import axios from 'axios';

const ALFA_LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';
const username = 'trojanmocx';

const endpoints = [
    `/${username}/dashboardalfa`,
    `/userProfile/${username}`,
    `/${username}/solved`,
    `/${username}/contest`
];

async function checkEndpoints() {
    for (const path of endpoints) {
        const fullUrl = `${ALFA_LEETCODE_API}${path}`;
        console.log(`Checking ${fullUrl}...`);
        try {
            const res = await axios.get(fullUrl);
            console.log(`[${path}] Status: ${res.status}`);
            if (res.status === 200) {
                console.log(`[${path}] Data snippet:`, JSON.stringify(res.data).substring(0, 150));
            }
        } catch (e) {
            console.error(`[${path}] Error: ${e.message}`);
        }
    }
}

checkEndpoints();
