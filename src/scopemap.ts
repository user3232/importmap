import path from 'node:path'
import { WildcardPatterns } from '@user3232/pattern'
import { PkgExports, PkgExportsValue, PkgImports, PkgImportsValue } from './types/types-pkg.js'
import { Nodemap } from './nodemap.js'
import { Filemap } from './filemap.js'







export type Scopemap = {
    exports: {
        [pkgUrl: string]: {
            [exportsSubpath: string]: string | null
        }
    },
    imports: {
        [pkgUrl: string]: {
            [importText: string]: string | null
        }
    }
}


export function scopemapFrom(
    env: string[],
    filemap: Filemap,
    nodemap: Nodemap,
    pkgJsonDir?: string | undefined,
): Scopemap {

    pkgJsonDir ??= '.'

    // do exports
    const exportsScopemap: {
        [pkgUrl: string]: {
            [exportsSubpath: string]: string | null
        }
    } = {}

    for(const [location, pkg] of Object.entries(nodemap.scopes ?? {})) {
        // if(location === '.') debugger
        const envResolvedExports = envResolveExports(env, pkg.type, pkg.exports)
        const resolvedExports = resolveImportsExports(envResolvedExports, filemap[location])
        
        if(resolvedExports) {
            exportsScopemap[location] = resolvedExports
        }
    }

    // do imports
    const importsScopemap: {
        [pkgUrl: string]: {
            [importText: string]: string | null
        }
    } = {}

    for(const [location, pkg] of Object.entries(nodemap.scopes ?? {})) {

        const envResolvedImports = envResolveImports(env, pkg.type, pkg.imports)

        const filesOrDependencies: string[] = [...filemap[location] ?? []]
        for(const [dependency, dependencyPath] of Object.entries(pkg.dependencies ?? {})) {
            filesOrDependencies.push(
                ...Object.keys(exportsScopemap[dependencyPath] ?? {})
                .map((exportsSubpath) => path.join(dependency, exportsSubpath))
            )
        }

        const resolvedImports = resolveImportsExports(envResolvedImports, filesOrDependencies)
        
        if(resolvedImports) {
            importsScopemap[location] = resolvedImports
        }
    }

    return {
        exports: exportsScopemap,
        imports: importsScopemap,
    }
}






export type EnvResolvedPkgImports = {
    [subpath: string]: string | null;
}


function envResolveImports(
    env: string[],
    jsType: 'require' | 'import',
    pkgImports: PkgImports | undefined
): EnvResolvedPkgImports | undefined {

    if(pkgImports === undefined) {
        return undefined
    }
    
    const pkgImportsSubimports: EnvResolvedPkgImports = {}
    for(const [subimport, pkgImportsValue] of Object.entries(pkgImports)) {
        if(subimport.startsWith('#')) {
            const resolvedPkgImportsValue = envResolveImportsExportsValue(
                env, 
                jsType, 
                pkgImportsValue
            )
            if(resolvedPkgImportsValue !== undefined) {
                pkgImportsSubimports[subimport!] = resolvedPkgImportsValue
            }
        }
    }
    if(Object.keys(pkgImportsSubimports).length !== 0) {
        return pkgImportsSubimports
    }
    return undefined
        
        
}








function resolveImportsExports(
    envResolvedExports: EnvResolvedPkgExports | EnvResolvedPkgImports | undefined,
    pkgFiles: string[] | undefined,
) {
    // if(envResolvedExports?.['./mime/i*.js'] === null) debugger
    if(!envResolvedExports) {
        return undefined        
    }

    pkgFiles ??= []

    const finiteSubpaths: string[] = []
    for(const [importPattern, filePattern] of Object.entries(envResolvedExports)) {
        finiteSubpaths.push(
            ...listResolvableImportsExportsSubpaths(importPattern, filePattern, pkgFiles)
        )
    }



    // resolve finiteSubpaths with wildcards resolver
    // substitute resolved files
    // build importmap imports
    const resolver = new WildcardPatterns(Object.keys(envResolvedExports))
    const resolvedExportsList: [string, string | null][] = []
    for(const finiteSubpath of finiteSubpaths) {
        const resolvedImport = resolver.matchBestToEx(finiteSubpath)
        if(resolvedImport !== undefined) {
            resolvedExportsList.push([
                finiteSubpath, 
                // path.join(pkgName, finiteSubpath), 
                substituteStarPattern(
                    envResolvedExports[resolvedImport.pattern]!,
                    resolvedImport.matched
                )
            ])
        }
    }
    const resolvedExports = Object.fromEntries(resolvedExportsList)
    return resolvedExports
}




function listResolvableImportsExportsSubpaths(
    importPattern: string, 
    filePattern: string | null,
    pkgFiles: string[],
) {
    // if(importPattern === '#mime/*') debugger
    const finiteSubpaths: string[] = []
    const {
        starred: importStarred, 
        prefix: importPrefix, 
        postfix: importPostfix
    } = stringStar(importPattern)
    
    if(!importStarred) {
        finiteSubpaths.push(importPattern)
    }
    else {
        if(filePattern === null) {
            // infinite subpaths possible -> skip
        }
        else {
            filePattern = path.normalize(filePattern)
            const {
                starred: fileStarred, 
                prefix: filePrefix, 
                postfix: filePostfix
            } = stringStar(filePattern)

            if(!fileStarred) {
                // infinite subpaths possible -> skip
            }
            else {
                for(let file of pkgFiles) {

                    file = path.normalize(file)
                    if(file.startsWith(filePrefix) && file.endsWith(filePostfix)){
                        const fileMatch = file.slice(
                            filePrefix.length, 
                            file.length - filePostfix.length
                        )
                        finiteSubpaths.push(
                            `${importPrefix}${fileMatch}${importPostfix}`
                        )
                    }
                }
            }
        }
    }
    return finiteSubpaths
}



function substituteStarPattern(
    pattern: string | null,
    starSubstitute: string,
) {
    if(pattern === null) {
        return pattern
    }
    const {starred, prefix, postfix} = stringStar(pattern)
    if(!starred) {
        return pattern
    }
    return `${prefix}${starSubstitute}${postfix}`

}




function stringStar(
    string: string
) {
    const starIndex = string.indexOf('*')
    if(starIndex === -1) {
        return {
            starred: false as const,
        }
    }
    return {
        starred: true as const,
        prefix: string.slice(0, starIndex),
        postfix: string.slice(starIndex + 1),
    }
}




export type EnvResolvedPkgExports = {
    [subpath: string]: string | null
}



function envResolveExports(
    env: string[],
    jsType: 'require' | 'import',
    pkgExports: PkgExports | undefined
): EnvResolvedPkgExports | undefined {

    if(pkgExports === undefined) {
        return undefined
    }
    else if(pkgExports === null) {
        return {'.': null}
    }
    else if(typeof pkgExports === 'string') {
        return {'.': pkgExports}
    }
    else if(Array.isArray(pkgExports)) {
        for(const pkgExportsFallback of pkgExports) {
            const envResolvedPkgExportsFallback = envResolveExports(
                env, 
                jsType, 
                pkgExportsFallback
            )
            if(envResolvedPkgExportsFallback !== undefined) {
                return envResolvedPkgExportsFallback
            }
        }
        return undefined
    }
    else if(typeof pkgExports === 'object') {
        // subexports
        if(
            Object.keys(pkgExports).every(
                (pkgExportsSubexport) => pkgExportsSubexport.startsWith('.')
            )
        ) {
            const pkgExportsSubexports: EnvResolvedPkgExports = {}
            for(const [subexport, pkgExportsValue] of Object.entries(pkgExports)) {
                const resolvedPkgExportsValue = envResolveImportsExportsValue(
                    env, 
                    jsType, 
                    pkgExportsValue
                )
                if(resolvedPkgExportsValue !== undefined) {
                    pkgExportsSubexports[subexport!] = resolvedPkgExportsValue
                }
            }
            if(Object.keys(pkgExportsSubexports).length !== 0) {
                return pkgExportsSubexports
            }
            return undefined
        }
        // scopes
        else if(
            Object.keys(pkgExports).every(
                (pkgExportsSubexport) => !pkgExportsSubexport.startsWith('.')
            )
        ) {
            const envResolvedScopedPkgExportsValue = dotRelativeFilePath(
                envResolveImportsExportsValue(
                    env, 
                    jsType, 
                    pkgExports
                )
            )
            if(envResolvedScopedPkgExportsValue !== undefined) {
                return {'.': envResolvedScopedPkgExportsValue}
            }
            return undefined
        }
        else {
            console.log({
                type: 'envResolveExports mixed scopes and subexports',
                pkgExports,
            })
            return undefined
        }
    }
    else {
        console.log({
            type: 'envResolveExports bad pkgExports type',
            pkgExports,
        })
        return undefined
    }
}


function dotRelativeFilePath(
    path: string | null | undefined
) {
    if(path === null || path === undefined) {
        return path
    }
    else if(path.endsWith('/')) {
        return undefined
    }
    else if(
        path.startsWith('./') 
        || path.startsWith('../') 
        || path.startsWith('/')
    ) {
        return path
    }
    else if(path === '.') {
        return undefined
    }
    else if(path === '..') {
        return undefined
    }
    else {
        return `./${path}`
    }
}


function envResolveImportsExportsValue(
    env: string[],
    jsType: 'require' | 'import',
    ie: PkgExportsValue | PkgImportsValue | undefined
): string | null | undefined {

    if(ie === undefined) {
        return undefined
    }
    else if(ie === null) {
        return null
    }
    else if(typeof ie === 'string') {
        return ie
        
    }
    else if(Array.isArray(ie)) {
        for(const ieFallback of ie) {
            const resolvedIe = envResolveImportsExportsValue(env, jsType, ieFallback)
            if(resolvedIe !== undefined) {
                return resolvedIe
            }
        }
        return undefined
    }
    else if(typeof ie === 'object') {
        for(const [scope, scopeIe] of Object.entries(ie)) {
            if(scope === 'default' || env.includes(scope)) {
                const resolvedScopeIe = envResolveImportsExportsValue(env, jsType, scopeIe)
                if(resolvedScopeIe !== undefined) {
                    return resolvedScopeIe
                }
            }
        }
        return undefined
    }
    else {
        console.log({
            type: 'envResolveImportValue bad ie type',
            ie,
        })
        return undefined
    }
}
