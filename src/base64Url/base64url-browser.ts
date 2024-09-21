

export function base64ToBase64Url(
    base64: string
): string {
    return [...base64].map((c) => 
        c === '/' ? '_' 
        : c === '+' ? '-' 
        : c === '=' ? '' 
        : c
    ).join('')
}

export function base64UrlToBase64(
    base64Url: string
): string {
    return [...base64Url].map((c) => 
        c === '_' ? '/' 
        : c === '-' ? '+' 
        : c
    ).join('')
}





export function bufferToBase64Url(
    buffer: ArrayBuffer
): string {
    const latin1BufferString = String.fromCharCode(...new Uint8Array(buffer))
    const base64 = btoa(latin1BufferString)
    return base64ToBase64Url(base64)
}


export function base64UrlToBuffer(
    base64Url: string,
): Uint8Array {
    const base64 = base64UrlToBase64(base64Url)
    const latin1BufferString = atob(base64)
    return Uint8Array.from(
        latin1BufferString,
        (c) => c.charCodeAt(0)
    )
}