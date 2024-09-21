

/**
 * An **import map** is a JSON object that allows developers to control 
 * how the browser resolves <<module specifiers>> when importing 
 * JavaScript modules. It provides a mapping between the text used as the 
 * <<module specifier>> in an `import` statement or `import()` operator, 
 * and the corresponding value that will replace the text when resolving 
 * the <<specifier>>.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#import_map_json_representation
 * @see https://html.spec.whatwg.org/multipage/webappapis.html#import-map
 */
export type Importmap = {
    /**
     * The value is a {@link ModuleSpecifierMap} `module specifier map`, 
     * which provides the mappings 
     * between module specifier text that might appear in an `import` 
     * statement or `import()` operator, and the text that will replace 
     * it when the specifier is resolved.
     * 
     * This is the fallback map that is searched for matching module 
     * specifiers if no `scopes` {@link Importmap.scopes} path URLs match, 
     * or if module specifier maps in matching `scopes` paths do not contain a key that 
     * matches the module specifier.
     */
    imports?: ModuleSpecifierMap,
    /**
     * Scopes define path-specific module specifier maps {@link ModuleSpecifierMap}, 
     * allowing the choice of map 
     * to depend on the path of the code importing the module.
     * 
     * The scopes object is a valid JSON object where each property is a 
     * `<<scope key>>` {@link URLString}, which is an URL path, with a corresponding 
     * value that is a `<<module specifier map>>` {@link ModuleSpecifierMap}.
     *
     *  If the URL of a script importing a module matches a 
     * <<scope key>> path, then the <<module specifier map>> value associated with 
     * the key is checked for matching specifiers first. 
     * If there are multiple matching scope keys, then the value associated with 
     * the most specific/nested scope paths are checked for matching module 
     * specifiers first. The fallback <<module specifier map>> in imports is 
     * used if there are no matching module specifier keys in any of the 
     * matching scoped module specifier maps.
     *
     * > **Note** 
     * >
     * > that the scope does not change how an address is resolved; relative addresses 
     * > are always resolved to the import map base URL.
     */
    scopes: {
        [urlPath in URLString]: ModuleSpecifierMap
    },
    /**
     * Defines a valid JSON object where the keys are strings containing valid 
     * absolute or relative URLs (starting with `/`, `./`, or `../`), and the 
     * corresponding values are valid 
     * {@link https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity#using_subresource_integrity integrity metadata}. 
     */
    integrity: {
        [urlPath in URLString]: SRI
    }
}


/**
 * Subresource Integrity string, e.g.:
 * 
 * `sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC`
 */
export type SRI = `${SRIAlg}-${SRIBase64Hash}`


/** 
 * {@link SRI} base64 encoded hash part.
 */
export type SRIBase64Hash = string
/**
 * {@link SRI} algorithm part.
 */
export type SRIAlg = 
    | 'sha256'
    | 'sha384'
    | 'sha512'




/**
 *
 * A "module specifier map" is a valid JSON object where the keys are text 
 * that may be present in the module specifier when importing a module, 
 * and the corresponding values are the URLs or paths that will replace 
 * this text when the module specifier is resolved to an address.
 *  
 * The module specifier map JSON object has the following requirements:
 *
 * * None of the keys may be empty.
 * * All of the values must be strings, defining either a valid 
 *   absolute URL or a valid URL string that starts with `/`, `./`, or `../`.
 * * If a key ends with `/`, then the corresponding value must also end with `/`. 
 *   A key with a trailing `/` can be used as a prefix for when mapping 
 *   (or remapping) modules addresses.
 * * The object properties' ordering is irrelevant: 
 *   if multiple keys can match the module specifier, 
 *   the most specific key is used (in other words, 
 *   a specifier "olive/branch/" would match before "olive/").
 * 
 */
export type ModuleSpecifierMap = {
    [text: string]: URLString
}




/**
 * Absolute URL or relative URL.
 */
export type URLString = string | `/${string}` | `./${string}` | `../${string}`









/**
 * Creates {@link SRI} with given `alg` for `data`.
 */
export async function encodeSRI(
    alg: SRIAlg,
    data: ArrayBuffer | ArrayBufferView
): Promise<{
    sri: SRI,
    hash: ArrayBuffer,
}> {
    const algToAlg = {
        sha256: 'SHA-256',
        sha384: 'SHA-384',
        sha512: 'SHA-512',
    }
    const hash = await crypto.subtle.digest(
        algToAlg[alg],
        data
    )
    
    const base64 = btoa(Array.from(
        new Uint8Array(hash), 
        (byte) => String.fromCodePoint(byte),
    ).join(''))

    return {
        sri: `${alg}-${base64}`,
        hash,
    }
}


/**
 * Decodes {@link SRI} `alg` and `data`.
 */
export async function decodeSRI(
    sri: SRI
): Promise<{
    alg: string,
    hash: Uint8Array,
}> {
    const sepIndex = sri.indexOf('-')
    const alg = sri.slice(0, sepIndex)
    const base64 = sri.slice(sepIndex + 1)

    const hash = Uint8Array.from(
        atob(base64),
        (m) => m.codePointAt(0)!
    )

    return {
        alg,
        hash,
    }
}


/**
 * Verifies whether data matches {@link SRI} or not.
 */
export async function verifySRI(
    sri: SRI,
    data: ArrayBuffer | ArrayBufferView
): Promise<boolean> {
    const {hash: sriHash, alg: sriAlg} = await decodeSRI(sri)
    const hash = new Uint8Array(await crypto.subtle.digest(sriAlg, data))

    for(let i = 0; i < hash.length; i++){
        if(hash[i] !== sriHash[i]) {
            return false
        }
    }
    return true
}
