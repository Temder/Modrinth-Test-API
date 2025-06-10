let rateLimit = document.getElementById('rate-limit-info');

function testApiCall() {
    fetch('/api/modrinth/call')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                rateLimit.getElementsByTagName('span')[0].textContent = 'Error fetching data from API';
            } else {
                rateLimit.getElementsByTagName('span')[0].innerHTML = `Limit: ${data.limit}<br>Remaining: ${data.remaining}<br>Reset: ${data.reset}`;
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            rateLimit.textContent = 'Failed to fetch data from API';
        });
}