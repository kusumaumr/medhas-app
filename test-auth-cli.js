const http = require('http');

const options = (path, method, body) => ({
    hostname: 'localhost',
    port: 5000,
    path: `/api/auth${path}`,
    method: method,
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': body ? Buffer.byteLength(body) : 0
    }
});

function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request(options(path, method, body), (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseBody });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

async function testAuth() {
    const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        phone: '1234567890'
    };

    console.log(`\n🧪 Testing Registration with ${testUser.email}...`);
    try {
        const regRes = await makeRequest('/register', 'POST', testUser);
        if (regRes.status === 201 || regRes.status === 200) {
            console.log('✅ Registration Successful:', regRes.data.message);
        } else {
            console.log('❌ Registration Failed:', regRes.status, regRes.data);
            return;
        }

        console.log(`\n🧪 Testing Login with ${testUser.email}...`);
        const loginRes = await makeRequest('/login', 'POST', {
            email: testUser.email,
            password: testUser.password
        });

        if (loginRes.status === 200) {
            console.log('✅ Login Successful:', loginRes.data.message);
            console.log('🔑 Token:', loginRes.data.token ? 'Received' : 'Missing');
        } else {
            console.log('❌ Login Failed:', loginRes.status, loginRes.data);
        }

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
        console.log('⚠️ Make sure the backend server is running on port 5000');
    }
}

testAuth();
