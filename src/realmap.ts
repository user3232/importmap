import fs from 'node:fs'
import { Pkg } from './types/types-pkg.js'
import treeverse from 'treeverse'
import path from 'node:path'





// console.log(await realmapFromFs('.'))
// console.log(await findPkgDependencies('.'))





/**
 * Maps package real runtime path to its `package.json`
 * `dependencies`, `peerDependencies` and `optionalDependencies`
 * to dependencies real runtime paths, e.g.
 * 
 * ```json
 * {
 *   "node_modules/react": {},
 *   "node_modules/react-dom": {
 *     "react": "node_modules/react"
 *   }
 * }
 * ```
 */
export type Depmap = {
    [pkgJsonDir: string]: {
        [alias: string]: typeof pkgJsonDir
    }
}


/**
 * Maps package real runtime path to its `package.json`, e.g.:
 * 
 * ```json
 * {
 *   "node_modules/react": {
 *     "name": "react",
 *     "version": "18.3.1"
 *   },
 *   "node_modules/react-dom": {
 *     "name": "react-dom",
 *     "version": "18.3.1",
 *     "peerDependencies": {
 *       "react": "^18.3.1"
 *     }
 *   }
 * }
 * ```
 */
export type Pakmap = {
    [pkgJsonDir: string]: Pkg
}





/**
 * Resolves all dependencies 
 */
export async function realmapFromFs(
    pkgJsonDir?: string | undefined
): Promise<{
    pakmap: Pakmap,
    depmap: Depmap,
}> {

    pkgJsonDir ??= '.'

    const depmap: Depmap = {}
    const pakmap: Pakmap = {}


    await treeverse.depth({
        tree: pkgJsonDir,
        async getChildren(node) {
            const pkgDependencies = await findPkgDependencies(node)
            
            depmap[node] = pkgDependencies.dependencies
            pakmap[node] = pkgDependencies.pkg
            return Object.values(pkgDependencies.dependencies)
        },
    })

    return {pakmap, depmap}
}




async function findPkgDependencies(
    pkgDirPath: string,
): Promise<{
    pkg: Pkg,
    dependencies: { [alias: string]: string }
}> {

    const pkg = await fs.promises.readFile(
        path.join(pkgDirPath, 'package.json'),
        {encoding: 'utf8'}
    )
    .then((pkgJson) => JSON.parse(pkgJson) as Pkg)
    .catch(() => undefined)

    if(!pkg) {
        throw new Error('This is not package directory', {
            cause: {pkgDirPath}
        })
    }

    const dependencies = new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
        ...Object.keys(pkg.optionalDependencies ?? {}),
    ])

    const resolvedDependencies: [string, string][] = []

    let currentDirPath = pkgDirPath
    while(true) {

        if(
            await fs.promises.access(path.join(
                currentDirPath, 
                'node_modules', 
            ))
            .then(() => true)
            .catch(() => false)
        ) {
            const maybeResolvedDependencies = await Promise.all(
                [...dependencies]
                .map((alias) => 
                    fs.promises.realpath(
                        path.join(
                            currentDirPath, 
                            'node_modules', 
                            alias,
                        )
                    )
                    .then((realpath) => [
                        alias, 
                        path.relative('.', realpath)
                    ] as [string, string])
                    .catch(() => null)
                )
            )
            .then((dependencies) => 
                dependencies
                .filter((dependency) => dependency !== null)
            )

            for(const meybeResolvedDependency of maybeResolvedDependencies) {
                if(meybeResolvedDependency !== null ) {
                    resolvedDependencies.push(meybeResolvedDependency)
                    dependencies.delete(meybeResolvedDependency[0])
                }
            }
            

            // for(const alias of [...dependencies]) {
            //     // node_modules dir
            //     const bundledPkgPath = path.join(
            //         currentDirPath, 
            //         'node_modules', 
            //         alias,
            //     )
            //     const bundledPkg = await fs.promises.realpath(
            //         bundledPkgPath
            //     )
            //     .then((realpath) => realpath)
            //     .catch(() => null)
    
            //     if(bundledPkg !== null ) {
            //         resolvedDependencies.push([alias, path.relative('.', bundledPkg)])
            //         dependencies.delete(alias)
            //     }
            // }
        }
    
        

        // nothing new will happen so exit
        if(
            currentDirPath === '.' 
            || currentDirPath === '/'
            || dependencies.size === 0
        ) {
            if(dependencies.size !== 0) {
                console.log({
                    type: 'Unresolved dependencies',
                    forPkgDir: pkgDirPath,
                    unresolved: [...dependencies].join(', '),
                })
            }
            return {
                pkg,
                dependencies: Object.fromEntries(resolvedDependencies),
            }
        }

        // go to parent
        currentDirPath = path.dirname(currentDirPath)

    }  
}