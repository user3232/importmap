import { Pkg, PkgAlias } from "./types-pkg.js"



/**
 * NPM's `package-lock.json` structure important for **importmap** package.
 * This lockfile represent how NPM resolved package dependencies
 * and contain information where needed packages were put in filesystem,
 * and also how those packages were obtained. Scripts runned by 
 * node use only directory structure.
 */
export type NpmLock = {
    /**
     * Package name from current directory
     * `package.json` file ({@link Pkg.name}).
     */
    name: string,
    /**
     * Package name from current directory
     * `package.json` file ({@link Pkg.version}).
     */
    version: string,
    /**
     * `package-lock.json` file version.
     */
    lockfileVersion: 3,
    /**
     * Information about how NPM resolved dependencies {@link NpmResolvedPkg}.
     * `packages` object will also contain `""` key
     * with value of {@link Pkg}
     */
    packages: {
        [npmPkgPath in NpmPkgPath]: NpmResolvedPkg
    } & {
        '': Pkg
    }
}




/**
 * {@link Pkg}s for NPM resolved dependencies.
 */
export type NpmPkgPathToPkgJson = {
    [npmPkgPath in NpmPkgPath]: Pkg
}



/**
 * File(?) path to pkg directory:
 * * bare === relative, e.g. `node_modules/react`, ``,
 * * relative: starting with `./node_modules/react`, `../`, e.g. `../mime`,
 * * absolute: starting with `/home/user/projects/project`.
 * 
 */
export type NpmPkgPath = string



/**
 * NPM resolved package info from {@link NpmLock.packages}.
 */
export type NpmResolvedPkg = {
    link?: undefined,
    /**
     * This resolved package is not part of other package bundle.
     */
    inBundle?: false,
    /**
     * For re-aliased package, it will be oryginal name. 
     * Oryginal name is used for self-imports.
     */
    name?: string,
    /**
     * Package version.
     */
    version: string,
    /**
     * Instruction for downloader how to obtain this package.
     */
    resolved: string,
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
} | {
    /**
     * Dependency is link. Orginal will be present in {@link NpmLock.packages}.
     */
    link: true,
    name?: undefined,
    resolved: NpmPkgPath,
} | {
    link?: undefined,
    resolved?: undefined,
    /**
     * This resolved package is part of other package bundle.
     */
    inBundle: true,
    /**
     * For re-aliased package, it will be oryginal name of this bundled package. 
     * Oryginal name is used for self-imports.
     */
    name?: string,
    /**
     * Package version of this bundled package.
     */
    version: string,
    /**
     * License of this bundled package.
     */
    license?: string,
    /**
     * Package executable(s) of this bundled package.
     */
    bin?: string | {
        [bin in PkgAlias]: string
    },
    /**
     * Package direct dependencies of this bundled package. 
     * Dependency alias must not start with `.`
     */
    dependencies?: {
        [alias in PkgAlias]: string
    },
    /**
     * Package direct peer dependencies of this bundled package. 
     * Dependency alias must not start with `.`
     */
    peerDependencies?: {
        [alias in PkgAlias]: string
    },
    /**
     * Package direct optional dependencies of this bundled package. 
     * Dependency alias must not start with `.`
     */
    optionalDependencies?: {
        [alias in PkgAlias]: string
    },
    /**
     * Package dependencies (and dependency dependencies)
     * to bundle with this bundled package.
     * 
     * If:
     * * `true` - all dependencies,
     * * `false` or not set - no dependencies,
     * * array - aliases of dependencies to be bundled with
     *   their all sub-dependencies.
     */
    bundleDependencies?: boolean | PkgAlias[],
}

