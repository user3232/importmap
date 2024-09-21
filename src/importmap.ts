import path from 'node:path'
import { Prefixes } from '@user3232/pattern'
import { Nodemap } from './nodemap.js'
import { Integritymap } from './integritymap.js'
import { pipableObjectFrom } from '@user3232/pipable'
import { Scopemap } from './scopemap.js'




export type Importmap = {
    imports?: {
        [importText: string]: string | null
    },
    scopes?: {
        [pkgUrl: string]: {
            [importText: string]: string | null
        }
    },
    integrity?: {
        [moduleUrl: string]: string
    },
}


export function importmapFrom(
    nodemap: Nodemap,
    scopemap: Scopemap,
    integritymap: Integritymap,
    pkgJsonDir?: string | undefined,
    baseUrl?: string | undefined,
): Importmap {

    pkgJsonDir ??= '.'
    baseUrl ??= '.'
    const pkgJsonUrl = path.join(baseUrl, pkgJsonDir)


    // importmap

    const importmapScopes: {
        [pkgUrl: string]: {
            [importText: string]: string | null
        }
    } = {}

    const pkgUrls = new Set([
        ...Object.keys(scopemap.exports), 
        ...Object.keys(scopemap.imports)]
    )
    for(const pkgUrl of pkgUrls) {

        const pkg = nodemap.scopes[pkgUrl]!
        const scope = path.join(baseUrl, pkgUrl)

        // insert exports
        const pkgExports = scopemap.exports[pkgUrl]
        if(pkgExports) {
            if(!importmapScopes[scope]) {
                importmapScopes[scope] = {}
            }
            // name subpaths
            for(const [exportsSubpath, exportsSubpathFile] of Object.entries(pkgExports)) {
                const pkgImport = path.join(pkg.name, exportsSubpath)
                if(exportsSubpathFile === null) {
                    importmapScopes[scope][pkgImport] = null
                }
                else {
                    importmapScopes[scope][pkgImport] = path.join(baseUrl, pkgUrl, exportsSubpathFile)
                }
            }
        }

        // insert dependencies
        for(const [dependency, dependencyPkgPath] of Object.entries(pkg.dependencies ?? {})) {
            const dependencyPkgExports = scopemap.exports[dependencyPkgPath]
            for(const [exportsSubpath, file] of Object.entries(dependencyPkgExports ?? {})) {
                const pkgImport = path.join(dependency, exportsSubpath)
                if(!importmapScopes[scope]) {
                    importmapScopes[scope] = {}
                }
                if(file === null) {
                    importmapScopes[scope][pkgImport] = null
                }
                else {
                    importmapScopes[scope][pkgImport] = path.join(baseUrl, dependencyPkgPath, file)
                }
            }
        }

        // insert imports
        const pkgImports = scopemap.imports[pkgUrl]
        if(pkgImports) {

            if(!importmapScopes[scope]) {
                importmapScopes[scope] = {}
            }

            const resolver = new Prefixes(Object.keys(pkg.dependencies ?? {}))

            for(const [importsSubpath, dependencyOrFile] of Object.entries(pkgImports)) {
                if(dependencyOrFile === null) {
                    importmapScopes[scope][importsSubpath] = null
                }
                else if(dependencyOrFile.startsWith('./')) {
                    importmapScopes[scope][importsSubpath] = path.join(baseUrl, pkgUrl, dependencyOrFile)
                }
                else {
                    const dependency = resolver.matchBestTo(dependencyOrFile)
                    if(dependency !== undefined) {
                        const dependencyPath = pkg.dependencies![dependency]!
                        const dependencyExports = scopemap.exports[dependencyPath]
                        if(dependencyExports !== undefined) {
                            const dependencySubpath = `.${dependencyOrFile.slice(dependency.length)}`
                            const file = dependencyExports[dependencySubpath]
                            if(file !== undefined) {
                                if(file === null) {
                                    importmapScopes[scope][importsSubpath] = null
                                }
                                else {
                                    importmapScopes[scope][importsSubpath] = path.join(baseUrl, dependencyPath, file)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const integrity = pipableObjectFrom(integritymap).flatmap(
        (pkgDir, files) => pipableObjectFrom(files).mapKey(
            (file) => path.join(baseUrl, pkgDir, file)
        ).value
    ).value
    



    return {
        imports: importmapScopes[pkgJsonUrl]!,
        scopes: importmapScopes,
        integrity,
    }

}



export function importmapRebase(
    importmap: Importmap,
    basePath: string,
    origin?: string | undefined
) {
    origin ??= ''
    const imports = pipableObjectFrom(importmap.imports ?? {})
    .map((_, modulePath) => modulePath === null 
        ? modulePath 
        : origin + path.join(basePath, modulePath)
    )
    .value

    const scopes = pipableObjectFrom(importmap.scopes ?? {})
    .mapKeyValue(
        (scope, _) => origin + path.join(basePath, scope, '/'),
        (_, imports) => pipableObjectFrom(imports)
            .map((_, modulePath) => modulePath === null 
                ? modulePath 
                : origin + path.join(basePath, modulePath)
            )
            .value,
    )
    .value

    const integrity = pipableObjectFrom(importmap.integrity ?? {})
    .mapKey((modulePath, _) => origin + path.join(basePath, modulePath))
    .value

    return {
        imports,
        scopes,
        integrity
    } as Importmap
}