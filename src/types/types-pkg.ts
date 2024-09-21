

/**
 * User `package.json` important fields for **importmap** package.
 */
export type Pkg = {
    link?: undefined,
    resolved?: undefined,
    /**
     * Name of package.
     * Also identifier used for self-imports.
     */
    name: string,
    /**
     * Version of package.
     */
    version: string,
    /**
     * How to download this package.
     */
    spec?: string,
    /**
     * `.js` files default format.
     * 
     * * If `module` then files with `.js` extension are ESM, 
     * * otherwise files with `.js` extension are CJS. 
     * * (Files with `.cjs` are always CJS.)
     * * (Files with `.mjs` are always ESM.)
     */
    type?: 'commonjs' | 'module',
    /**
     * If no {@link Pkg.exports} it is pkg entrypoint.
     * Entrypoint format is as {@link Pkg.type} suggest.
     */
    main?: string,
    /**
     * Package exports.
     */
    exports?: PkgExports,
    /**
     * Package imports.
     */
    imports?: PkgImports,
    /**
     * Package executable(s).
     */
    bin?: string | {
        [bin in PkgAlias]: string
    },
    /**
     * Package direct dependencies. Dependency alias
     * must not start with `.`
     */
    dependencies?: {
        [alias in PkgAlias]: string
    },
    /**
     * Package direct peer dependencies. Dependency alias
     * must not start with `.`
     */
    peerDependencies?: {
        [alias in PkgAlias]: string
    },
    /**
     * Package direct optional dependencies. Dependency alias
     * must not start with `.`
     */
    optionalDependencies?: {
        [alias in PkgAlias]: string
    },
    /**
     * Package dependencies (and dependency dependencies)
     * to bundle with package.
     * 
     * If:
     * * `true` - all dependencies,
     * * `false` or not set - no dependencies,
     * * array - aliases of dependencies to be bundled with
     *   their all sub-dependencies.
     */
    bundleDependencies?: boolean | PkgAlias[],
}






/**
 * Dependency specifier in {@link Pkg}.
 * Must **not** start with `.`
 */
export type PkgAlias = string


/**
 * File specifier in {@link Pkg}.
 * Must start with `./`
 */
export type PkgFile = `./${string}`


/**
 * Scope of import {@link PkgImportsValue} or export {@link PkgExportsValue}.
 * Must **not** start with `.`
 */
export type PkgScope = string






/**
 * Exports of package ({@link Pkg.exports}). Supports parametrization
 * by conditions, and allows folback lists.
 * 
 * Examples:
 * 
 * ```ts
 * 
 * const nodeExports1: NodeExports = null
 * const nodeExports2: NodeExports = './index.js'
 * const nodeExports3: NodeExports = {scope: null}
 * const nodeExports4: NodeExports = {'.': null}
 * const nodeExports5: NodeExports = {'./abc': null}
 * const nodeExports6: NodeExports = [{'./abc': null}, './index.js']
 * 
 * ```
 */
export type PkgExports = PkgExportsValue | PkgExportsSubpaths
/**
 * Single export value. May be:
 * * `null` for not allowed,
 * * or point to file 
 * * or may be parametrized by condition
 * * or may be list of above for fallbacks.
 */
export type PkgExportsValue = null | PkgFile | PkgExportScope | PkgExportsValue[]
/**
 * Map of subaliases with values of {@link PkgExportsValue}.
 */
export type PkgExportsSubpaths = {
    [alias in PkgExportAlias]: PkgExportsValue
}
/**
 * Export (sub) alias can be:
 * * `.` for root alias
 * * something starting with `./` for sub alias.
 */
export type PkgExportAlias = '.' | PkgFile
/**
 * Conditionals for {@link PkgExportsValue} values.
 */
export type PkgExportScope = {
    [scope in PkgScope]: PkgExportsValue
}






/**
 * Imports of package ({@link Pkg.imports}). Supports parametrization
 * by conditions, and allows folback lists.
 * 
 * Examples:
 * 
 * ```ts
 * 
 * const nodeImport1: NodeImports = {'#react-dom/client': null}
 * const nodeImport2: NodeImports = {'#react-dom/client': './client-mokup.js'}
 * const nodeImport3: NodeImports = {'#react-dom/client': 'my-react-dom/client'}
 * const nodeImport4: NodeImports = {'#react-dom/client': 'my-react-dom/client'}
 * const nodeImport5: NodeImports = {'#react-dom/client': {
 *     production: 'my-react-dom/client', 
 *     default: 'react-dom/client'
 * }}
 * const nodeImport6: NodeImports = {'#react-dom/client': [
 *     {
 *         production: 'my-react-dom/client', 
 *         default: 'react-dom/client'
 *     },
 *     './client.js',
 *     null
 * ]}
 * ```
 */
export type PkgImports = {
    [alias in PkgImportsAlias]: PkgImportsValue
}
/**
 * {@link PkgImports} alias must start with `#`.
 */
export type PkgImportsAlias = `#${string}`
/**
 * {@link PkgImports} alias value. It can be:
 * * null to restrict import,
 * * file to import package file,
 * * bare specifier {@link PkgImportsBare} for package export (root or sub)
 *   aliased in {@link Pkg.dependencies} or
 *   {@link Pkg.devDependencies} or {@link Pkg.peerDependencies} or
 *   {@link Pkg.optionalDependencies} to import file from one of package 
 *   dependencies.
 * * scopes map {@link PkgImportsScope} for defining import required envirement,
 * * list of all above for follbacks.
 */
export type PkgImportsValue = null | PkgFile | PkgImportsBare | PkgImportsScope | PkgImportsValue[]
/**
 * Import specifier for package export (root or sub).
 */
export type PkgImportsBare = string
/**
 * Defines conditions for import value {@link PkgImportsValue}.
 */
export type PkgImportsScope = {
    [scope in PkgScope]: PkgImportsValue
}