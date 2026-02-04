
async function test() {
    console.log('Testing with empty string...');
    const res1 = await fetch('http://localhost:8080/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }),
    });
    console.log('Empty string response:', res1.status, res1.statusText);
    if (res1.status !== 200) {
        console.log('Error message:', await res1.json());
    }

    console.log('\nTesting with valid string...');
    const res2 = await fetch('http://localhost:8080/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'これはテストです。' }),
    });
    console.log('Valid string response:', res2.status, res2.statusText);
}

test();
