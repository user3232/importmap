import { bufferToBase64Url } from "../base64Url/base64url-browser.js"


export async function stringToSha1Base64Url(
    string: string
): Promise<string> {
    const hashBuffer = await stringToHash(string, 'SHA-1')
    return bufferToBase64Url(hashBuffer)
}


export async function subresourceIntegrity(
    buffer: ArrayBuffer,
    algorithm: 'sha256' | 'sha384' | 'sha512'
): Promise<string> {
    const hash = await crypto.subtle.digest(
        {
            sha256: 'SHA-256',
            sha384: 'SHA-384',
            sha512: 'SHA-512',
        }[algorithm], 
        buffer
    )
    const hashBase64Url = bufferToBase64Url(hash)
    return `${algorithm}-${hashBase64Url}`
}




export async function stringToHash(
    string: string,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
): Promise<ArrayBuffer> {
    return await crypto.subtle.digest(
        algorithm, 
        new TextEncoder().encode(string)
    )
}

