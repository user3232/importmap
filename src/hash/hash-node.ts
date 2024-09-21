import crypto from 'node:crypto'


export function stringToSha1Base64Url(
    string: string
): string {
    return crypto.hash('sha1', string, 'base64url')
}


export function subresourceIntegrity(
    buffer: ArrayBuffer,
    algorithm: 'sha256' | 'sha384' | 'sha512'
): string {
    const hashBase64Url = crypto.hash(algorithm, Buffer.from(buffer), 'base64url')
    return `${algorithm}-${hashBase64Url}`
}


export function stringToHash(
    string: string,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
): ArrayBuffer {
    return crypto.hash({
        'SHA-1': 'sha1',
        'SHA-256': 'sha256',
        'SHA-384': 'sha384',
        'SHA-512': 'sha512'
    }[algorithm], string, 'buffer')
}