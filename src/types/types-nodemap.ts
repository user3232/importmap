import type { Importmap, SRI } from './types-importmap.js'
import { PkgExports, PkgImports } from './types-pkg.js'

/**
 * 
 * Nodemap, is very similar to {@link Importmap} but with imports, exports
 * and dependencies in node format.
 * 
 */
export type Nodemap = {
    specifier: PkgSpecifierMap,
    scopes?: {
        [filePath in FilePath]: PkgSpecifierMap
    },
    integrity?: {
        [filePath in FilePath]: SRI
    }
}


/**
 * Path to local file, must start with `./`
 */
export type FilePath = `./${string}`
/**
 * Must not start with `.` or `#`
 */
export type DependencyAlias = string


/**
 * Information needed to resolve package imports.
 */
export type PkgSpecifierMap = {
    name?: string,
    type: 'import' | 'export',
    imports?: PkgImports,
    exports?: PkgExports,
    dependencies?: {
        [depencencyAlias in DependencyAlias]: FilePath
    },
}