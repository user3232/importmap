// src/hash/hash-node.ts
import crypto from "node:crypto";
function stringToSha1Base64Url(string) {
  return crypto.hash("sha1", string, "base64url");
}
function subresourceIntegrity(buffer, algorithm) {
  const hashBase64Url = crypto.hash(algorithm, Buffer.from(buffer), "base64url");
  return `${algorithm}-${hashBase64Url}`;
}
function stringToHash(string, algorithm) {
  return crypto.hash({
    "SHA-1": "sha1",
    "SHA-256": "sha256",
    "SHA-384": "sha384",
    "SHA-512": "sha512"
  }[algorithm], string, "buffer");
}
export {
  stringToHash,
  stringToSha1Base64Url,
  subresourceIntegrity
};
