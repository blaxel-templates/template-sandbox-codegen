import assert from "node:assert/strict";
import http from "node:http";

// Start Next.js with NEXT_ALLOWED_DEV_ORIGINS=demo.preview.example.com first.
const base = process.argv[2] ?? "http://127.0.0.1:3387";
const allowed = "https://demo.preview.example.com";
const denied = "https://untrusted.example.com";
const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
const asset = html.match(/src="([^"]+\/_next\/[^"]+|\/_next\/[^"]+)"/)?.[1];
assert.ok(asset, "rendered page must include a Next.js development asset");
for (const [origin, expected] of [[allowed, 200], [denied, 403]]) {
  const response = await fetch(new URL(asset.replaceAll("&amp;", "&"), base), {
    headers: { Origin: origin, "Sec-Fetch-Site": "cross-site" },
  });
  assert.equal(response.status, expected, `asset origin ${origin}`);
  await response.arrayBuffer();
}
function websocketStatus(origin) {
  return new Promise((resolve, reject) => {
    const req = http.request(new URL("/_next/hmr", base), {
      headers: { Origin: origin, Connection: "Upgrade", Upgrade: "websocket",
        "Sec-WebSocket-Version": "13", "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==" },
    });
    req.setTimeout(5000, () => req.destroy(new Error("HMR handshake timed out")));
    req.on("upgrade", (res, socket) => { socket.destroy(); resolve(res.statusCode); });
    req.on("response", (res) => { res.resume(); resolve(res.statusCode); });
    req.on("error", (error) => {
      // Next.js rejects an upgraded socket with a plain Unauthorized payload.
      if (error.rawPacket?.toString() === "Unauthorized") resolve("Unauthorized");
      else reject(error);
    });
    req.end();
  });
}
assert.equal(await websocketStatus(allowed), 101, "trusted preview HMR connects");
assert.equal(await websocketStatus(denied), "Unauthorized", "untrusted preview HMR is rejected");
console.log("PASS: page, trusted assets and HMR, untrusted assets and HMR");
