const fs = require('fs');

async function testWebProfileInfo(handle) {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
    
    let sessionId = '';
    let csrfToken = '';
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const sessionMatch = env.match(/INSTAGRAM_SESSION_ID=(.*)/);
        if (sessionMatch) sessionId = sessionMatch[1].trim();
        
        const csrfMatch = env.match(/INSTAGRAM_CSRF_TOKEN=(.*)/);
        if (csrfMatch) csrfToken = csrfMatch[1].trim();
    } catch (e) {}

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-IG-App-ID": "936619743392459",
        "X-IG-WWW-Claim": "0",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": `sessionid=${sessionId}; csrftoken=${csrfToken || ''}`,
        "Sec-CH-UA": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    };
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;

    const res = await fetch(url, { headers });
    console.log("Status:", res.status);
    const text = await res.text();
    if (res.status === 200) {
        const data = JSON.parse(text);
        if (data.data?.user) {
            console.log("Follower count:", data.data.user.edge_followed_by?.count);
            console.log("Is private:", data.data.user.is_private);
        } else {
            console.log("No user in response. Data:", data);
        }
    } else {
        console.log("Failed. Body length:", text.length, text.substring(0, 500));
    }
}

testWebProfileInfo('harsh.bgmi').catch(console.error);
