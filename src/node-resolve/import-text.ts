


export function importTextToAliasAndPath(
    moduleImport: string
): {
    alias: string,
    path: string,
} {
    let sepIndex = moduleImport.indexOf('/')
    if(moduleImport.startsWith('@')) {
        sepIndex = moduleImport.indexOf('/', sepIndex + 1)
    }
    if(sepIndex === -1) {
        return {
            alias: moduleImport,
            path: '.'
        }
    }

    const resource = moduleImport.slice(0, sepIndex)
    const subresource = moduleImport.slice(sepIndex + 1)
    return {
        alias: resource,
        path: `./${subresource}`
    }
}
