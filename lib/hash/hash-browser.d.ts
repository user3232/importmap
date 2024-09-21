export declare function stringToSha1Base64Url(string: string): Promise<string>;
export declare function subresourceIntegrity(buffer: ArrayBuffer, algorithm: 'sha256' | 'sha384' | 'sha512'): Promise<string>;
export declare function stringToHash(string: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<ArrayBuffer>;
