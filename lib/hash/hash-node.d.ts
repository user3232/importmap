export declare function stringToSha1Base64Url(string: string): string;
export declare function subresourceIntegrity(buffer: ArrayBuffer, algorithm: 'sha256' | 'sha384' | 'sha512'): string;
export declare function stringToHash(string: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): ArrayBuffer;
