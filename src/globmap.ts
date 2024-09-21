import treeverse from 'treeverse'
import { Depmap, Pakmap } from './realmap.js'



/**
 * Maps packages real runtime paths to global names.
 * Global name of package real runtime directory:
 * 
 * * for packages without `dependencies`, `peerDependencies`
 *   and `optionalDependencies` is package name and version 
 *   of its `package.json`,
 * * for packages without cyclic dependencies is package name and version 
 *   of its `package.json` and hash ({@link stringToSha256To10BToBase64Url})
 *   of its dependencies (in order as in `package.json`) mapped to global names.
 * 
 * > **Note**
 * >
 * > This means package global name glues package with
 * > exact dependencies.
 * 
 * Example:
 * 
 * ```json
 * {
 *   "node_modules/react": "react@18.3.1",
 *   "node_modules/react-dom": "react-dom@18.3.1:bvAndLAvDYeWRg"
 * }
 * ```
 */
export type Globmap = {
    [pkgDir: string]: string
}




export async function globmapFrom(
    pakmap: Pakmap,
    depmap: Depmap,
    pkgDir?: string | undefined
): Promise<Globmap> {
    const globmap: Globmap = {}

    pkgDir ??= '.'

    await treeverse.depth({
        tree: pkgDir,
        visit(node) {
            return node
        },
        async leave(node, children) {
            const {name, version} = pakmap[node]!
            if(children.length === 0) {
                const globalizedPath = `${name}@${version}`
                globmap[node] = globalizedPath
                return globalizedPath
            }
            const dependencies = children.join(',')
            const dependenciesHash = await stringToSha256To10BToBase64Url(dependencies)
            const globalizedPath = `${name}@${version}:${dependenciesHash}`
            globmap[node] = globalizedPath
            return globalizedPath
        },
        async getChildren(node) {
            return Object.values(depmap[node] ?? {})
        },
    })

    return globmap
}


async function stringToSha256To10BToBase64Url(string: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(
        'SHA-256', 
        new TextEncoder().encode(string)
    ).then((buf) => buf.slice(0, 10))

    const btoaRes = btoa(String.fromCodePoint(...new Uint8Array(hashBuffer)))
    return [...btoaRes].map((c) => 
        c === '/' ? '_' 
        : c === '+' ? '-' 
        : c === '=' ? '' 
        : c
    ).join('')

    // const buffRes = Buffer.from(hashBuffer).toString('base64url')
    // return buffRes
}

