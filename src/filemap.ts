import { glob } from 'glob'
import path from 'node:path'
import { type Pakmap } from './realmap.js'
import { type Globmap } from './globmap.js'



// console.log(await hashFile('package.json', 'sha256'))


// const pkgJsonDir = '.'
// import { realmapFromFs } from './realmap.js'
// const {pakmap, depmap, globmap, specmap } = await realmapFromFs(pkgJsonDir)
// const filemap = await filemapFrom(pakmap)
// const integritymap = await integritymapFrom(filemap, 'sha256')
// console.log(integritymap)




export function filemapGlobalFrom(
    filemap: Filemap,
    globmap: Globmap,
): Filemap {
    const globalFilemap: Filemap = {}
    for(const pkgDir of Object.keys(filemap)) {
        const pkgDirGlob = globmap[pkgDir]
        if(pkgDirGlob !== undefined) {
            const pkgFiles = filemap[pkgDirGlob]
            if(pkgFiles !== undefined) {
                globalFilemap[pkgDirGlob] = pkgFiles
            }
        }
    }
    return globalFilemap
}


/**
 * Maps package real path to list of its **importable** files
 * (`.cjs`, `.mjs`, `.js`, `.json`), e.g.
 * 
 * ```json
 * {
 *   "node_modules/react": [
 *     "package.json",
 *     "esm/index.development.js",
 *     "esm/index.production.js",
 *     "cjs/index.development.js",
 *     "cjs/index.production.js"
 *   ],
 *   "node_modules/@org/pkg": [
 *     "index.mjs",
 *     "index.cjs",
 *     "package.json"
 *   ]
 * }
 * ```
 */
export type Filemap = {
    [pkgDir: string]: ImportableFile[]
}
export type ImportableFile = `${string}.js` | `${string}.mjs` | `${string}.cjs`

export async function filemapFrom(
    pakmap: Pakmap,
    rootPkgDir?: string | undefined,
): Promise<Filemap> {
    rootPkgDir ??= '.'
    return Object.fromEntries(
        await Promise.all(
            Object.keys(pakmap)
            .map<Promise<[string, ImportableFile[]]>>(async (pkgDir) => [
                pkgDir, 
                await glob(
                    ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.json'], 
                    {
                        nodir: true, 
                        cwd: path.join(pkgDir, rootPkgDir),
                        ignore: [
                            'node_modules/**',
                            'node_packages/**',
                        ],
                        // dotRelative: true
                    }
                ) as ImportableFile[]
            ])
        )
    )
}


