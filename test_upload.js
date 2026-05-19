async function test() {
  const base64Pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const res = await fetch('http://localhost:3002/api/admin/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': 'mySecretAdmin2024!'
    },
    body: JSON.stringify({ image: base64Pixel })
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
}
test();
