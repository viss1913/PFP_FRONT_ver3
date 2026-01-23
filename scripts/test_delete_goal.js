import axios from 'axios';

const BASE_URL = 'https://pfpbackend-production.up.railway.app';
const AGENT_EMAIL = 'vissarovav@gmail.com';
const AGENT_PASSWORD = '123456';
const CLIENT_ID = 91;
const GOAL_ID_TO_DELETE = 246;

async function runTest() {
    try {
        console.log(`[Test] Logging in as ${AGENT_EMAIL}...`);
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: AGENT_EMAIL,
            password: AGENT_PASSWORD
        });

        const token = loginRes.data.token;
        console.log('[Test] Login success. Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 1. Get current state
        console.log(`[Test] Fetching current goals for client ${CLIENT_ID}...`);
        const clientRes = await axios.get(`${BASE_URL}/api/client/${CLIENT_ID}`, config);
        const goalsBefore = clientRes.data.goals || [];
        console.log(`[Test] Goals before deletion: ${goalsBefore.length}`);

        const targetExists = goalsBefore.some(g => g.id === GOAL_ID_TO_DELETE);
        if (!targetExists) {
            console.log(`[Warning] Goal ${GOAL_ID_TO_DELETE} not found in the list. Maybe it was already deleted?`);
        } else {
            console.log(`[Test] Goal ${GOAL_ID_TO_DELETE} found. Proceeding with deletion.`);
        }

        // 2. Delete Goal
        console.log(`[Test] Sending DELETE request: /api/client/${CLIENT_ID}/goals/${GOAL_ID_TO_DELETE}`);
        const deleteRes = await axios.delete(`${BASE_URL}/api/client/${CLIENT_ID}/goals/${GOAL_ID_TO_DELETE}`, config);

        console.log('[Test] Delete response status:', deleteRes.status);

        // The endpoint should return the new calculation result
        const newCalc = deleteRes.data.calculation?.calculation || deleteRes.data.calculation;
        const goalsAfterCalc = newCalc?.goals || [];

        console.log(`[Test] Goals in NEW calculation response: ${goalsAfterCalc.length}`);
        const foundInCalc = goalsAfterCalc.some(g => (g.goal_id === GOAL_ID_TO_DELETE || g.id === GOAL_ID_TO_DELETE));

        if (foundInCalc) {
            console.error('[FAIL] Goal STILL EXISTS in the calculation result returned by DELETE!');
        } else {
            console.log('[SUCCESS] Goal NOT found in the calculation result returned by DELETE.');
        }

        // 3. Final verification - fetch client again
        console.log('[Test] Fetching client again for final confirmation...');
        const finalClientRes = await axios.get(`${BASE_URL}/api/client/${CLIENT_ID}`, config);
        const goalsFinal = finalClientRes.data.goals || [];
        const foundInDB = goalsFinal.some(g => g.id === GOAL_ID_TO_DELETE);

        if (foundInDB) {
            console.error('[FAIL] Goal STILL EXISTS in the database after successful DELETE call!');
        } else {
            console.log('[SUCCESS] Goal removed from database.');
        }

    } catch (error) {
        console.error('[Error] Test failed:', error.response?.data || error.message);
    }
}

runTest();
