import { WildcardPatterns } from '@user3232/pattern'
import type { Pkg, PkgImportsAlias, PkgImportsValue } from '../types/types-pkg.js'
import { replacePatternWith } from './pattern.js'



export function resolvePkgImportsImport(
    importHash: string,
    pkg: Pkg,
    env: string[],
): string | null | undefined {
    const importsWildcards = new WildcardPatterns(
        Object.keys(pkg.imports ?? {})
    )
    const match = importsWildcards.matchBestToEx(importHash)
    if(!match) {
        return undefined
    }
    const {matched, pattern} = match
    const pkgImport = pkg.imports?.[pattern as PkgImportsAlias]!

    const resolvedPattern = resolvePkgImportsValue(env, pkgImport)
    if(resolvedPattern === null || resolvedPattern === undefined) {
        return resolvedPattern
    }

    // if pattern with * then substitute matched in resolved
    // if it is an existing file or pkg dependency job done
    // if not then continue.
    const resolved = replacePatternWith(resolvedPattern, matched)
    return resolved
}


function resolvePkgImportsValue(
    env: string[],
    pkgImport: PkgImportsValue,
): string | null | undefined {
    // null
    if(
        pkgImport === null
    ) {
        return null
    }
    // bare or file
    else if(
        typeof pkgImport === 'string'
    ) {
        return pkgImport
    }
    else if(
        Array.isArray(pkgImport)
    ) {
        for(const fallbackPkgImport of pkgImport) {
            const resolved = resolvePkgImportsValue(
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
        typeof pkgImport === 'object'
    ) {
        for(const [scope, scopePkgImport] of Object.entries(pkgImport)) {
            if(scope === 'default' || env.includes(scope)) {
                const resolved = resolvePkgImportsValue(
                    env,
                    scopePkgImport
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
