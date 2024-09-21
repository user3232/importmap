// src/base64Url/base64url-browser.ts
function base64ToBase64Url(base64) {
  return [...base64].map(
    (c) => c === "/" ? "_" : c === "+" ? "-" : c === "=" ? "" : c
  ).join("");
}
function bufferToBase64Url(buffer) {
  const latin1BufferString = String.fromCharCode(...new Uint8Array(buffer));
  const base64 = btoa(latin1BufferString);
  return base64ToBase64Url(base64);
}

// src/hash/hash-browser.ts
async function stringToSha1Base64Url(string) {
  const hashBuffer = await stringToHash(string, "SHA-1");
  return bufferToBase64Url(hashBuffer);
}
async function subresourceIntegrity(buffer, algorithm) {
  const hash = await crypto.subtle.digest(
    {
      sha256: "SHA-256",
      sha384: "SHA-384",
      sha512: "SHA-512"
    }[algorithm],
    buffer
  );
  const hashBase64Url = bufferToBase64Url(hash);
  return `${algorithm}-${hashBase64Url}`;
}
async function stringToHash(string, algorithm) {
  return await crypto.subtle.digest(
    algorithm,
    new TextEncoder().encode(string)
  );
}
export {
  stringToHash,
  stringToSha1Base64Url,
  subresourceIntegrity
};
