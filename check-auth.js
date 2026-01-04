import axios from 'axios';

const API_URL = 'https://pfpbackend-production.up.railway.app/api';

async function checkAuth() {
    console.log('Checking login...');
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'testuser@example.com',
            password: 'Test1234'
        });
        console.log('Login successful! Token:', loginRes.data.token ? 'Received' : 'Missing');
    } catch (e) {
        console.log('Login failed:', e.response ? e.response.status : e.message);
        if (e.response && e.response.status === 401) {
            console.log('Attempting registration...');
            try {
                const regRes = await axios.post(`${API_URL}/auth/register`, {
                    email: 'testuser@example.com',
                    password: 'Test1234',
                    name: 'Test Agent',
                    agentId: 1
                });
                console.log('Registration successful!', regRes.data);
            } catch (regErr) {
                console.log('Registration failed:', regErr.response ? regErr.response.data : regErr.message);
            }
        }
    }
}

checkAuth();
