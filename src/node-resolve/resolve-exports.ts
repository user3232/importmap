import { WildcardPatterns } from '@user3232/pattern'
import { Pkg, PkgExportAlias, PkgExportsSubpaths, PkgExportsValue } from '../types/types-pkg.js'
import { replacePatternWith } from './pattern.js'


export function resolvePkgExport(
    path: string,
    pkg: Pkg,
    env: string[],
): string | null | undefined {
    if(pkg.exports !== undefined) {
        return resolvePkgExportsExport(
            path,
            pkg.exports,
            env ?? []
        )
    }
    else if (typeof pkg.main === 'string' && pkg.main.startsWith('./')) {
        return pkg.main
    }
    else {
        return undefined
    }
}



function resolvePkgExportsExport(
    exportPath: string,
    pkgExports: unknown,
    env: string[],
): string | null | undefined {

    // is default
    if(pkgExports === undefined) {
        return undefined
    }
    else if (pkgExports === null) {
        if(exportPath === '.') {
            return null
        }
        return undefined
    }
    else if (Array.isArray(pkgExports)) {
        for(const fallbackPkgExports of pkgExports) {
            const resolved = resolvePkgExportsExport(
                exportPath,
                fallbackPkgExports,
                env,
            )
            if(resolved !== undefined) {
                return resolved
            }
        }
        return undefined
    }
    else if (typeof pkgExports === 'object') {
        // pkg defines subexports
        if(
            Object.keys(pkgExports)
            .every((pkgExport) => pkgExport.startsWith('.'))
        ) {
            const exportsWildcards = new WildcardPatterns(
                Object.keys(pkgExports)
            )
            const match = exportsWildcards.matchBestToEx(exportPath)
            if(!match) {
                return undefined
            }
            const {matched, pattern} = match
            const resolvedPattern = resolvePkgExportsValue(
                env, 
                (pkgExports as PkgExportsSubpaths)[pattern as PkgExportAlias]!
            )
            if(resolvedPattern === null || resolvedPattern === undefined) {
                return resolvedPattern
            }
            const resolved = replacePatternWith(resolvedPattern, matched)
            return resolved
        }
        // pkg defines only `.` export
        else {
            if(exportPath !== '.') {
                return undefined
            }
            const resolvedPattern = resolvePkgExportsValue(
                env, 
                (pkgExports as PkgExportsSubpaths)['.']!
            )
            return resolvedPattern
        }
    }
    else {
        return undefined
    }
}



function resolvePkgExportsValue(
    env: string[],
    pkgExport: PkgExportsValue,
): string | null | undefined {
    // null
    if(
        pkgExport === null
    ) {
        return null
    }
    // file
    else if(
        typeof pkgExport === 'string'
    ) {
        return pkgExport
    }
    else if(
        Array.isArray(pkgExport)
    ) {
        for(const fallbackPkgImport of pkgExport) {
            const resolved = resolvePkgExportsValue(
                env,
                fallbackPkgImport
            )
            if(resolved !== undefined) {
                return resolved
            }
        }
        return undefined
    }
    else if(
        typeof pkgExport === 'object'
    ) {
        for(const [scope, scopePkgExport] of Object.entries(pkgExport)) {
            if(scope === 'default' || env.includes(scope)) {
                const resolved = resolvePkgExportsValue(
                    env,
                    scopePkgExport
                )
                if(resolved !== undefined) {
                    return resolved
                }
            }
        }
        return undefined
    }
    else {
        return undefined
    }
}
