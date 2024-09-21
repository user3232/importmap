import { PkgAlias, PkgExports, PkgImports } from './types-pkg.js';
import { NpmPkgPath } from './types-npm-pkg.js';
/**
 * Maps package path {@link NpmPkgPath} to node
 * resolved package info {@link RealmapResolvedPkg}.
 */
export type Realmap = {
    name: string;
    version: string;
    resolved?: string;
    /**
     * Files flatted from PkgJson:
     * files, `packate.json`, `README`, `LICENSE`.
     */
    files?: {
        [file in string]: string | null;
    };
    packages: {
        [npmPkgPath in NpmPkgPath]: RealmapResolvedPkg;
    };
};
/**
 * Node resolved package with dependencies.
 */
export type RealmapResolvedPkg = {
    /**
     * Name of package.
     * Also identifier used for self-imports.
     */
    name: string;
    /**
     * Version of package.
     */
    version: string;
    /**
     * `.js` files default format.
     *
     * * If `module` then files with `.js` extension are ESM,
     * * otherwise files with `.js` extension are CJS.
     * * (Files with `.cjs` are always CJS.)
     * * (Files with `.mjs` are always ESM.)
     */
    type?: 'commonjs' | 'module';
    /**
     * If no {@link PkgJson.exports} it is pkg entrypoint.
     * Entrypoint format is as {@link PkgJson.type} suggest.
     */
    main?: string;
    /**
     * Package exports.
     */
    exports?: PkgExports;
    /**
     * Package imports.
     */
    imports?: PkgImports;
    /**
     * Package direct dependencies. Dependency alias
     * must not start with `.`. Dependency value
     * is path to node resolved package {@link RealmapResolvedPkg}
     * by {@link NpmPkgPath} key of {@link Realmap}.
     */
    dependencies?: {
        [alias in PkgAlias]: NpmPkgPath;
    };
    /**
     * Package direct peer dependencies. Dependency alias
     * must not start with `.`. Dependency value
     * is path to node resolved package {@link RealmapResolvedPkg}
     * by {@link NpmPkgPath} key of {@link Realmap}.
     */
    peerDependencies?: {
        [alias in PkgAlias]: NpmPkgPath;
    };
    /**
     * Package direct optional dependencies. Dependency alias
     * must not start with `.`. Dependency value
     * is path to node resolved package {@link RealmapResolvedPkg}
     * by {@link NpmPkgPath} key of {@link Realmap}
     * or `null` if package not present.
     */
    optionalDependencies?: {
        [alias in PkgAlias]?: NpmPkgPath | null;
    };
} & (RealmapResolvedPkgNotBundled | RealmapResolvedPkgBundled);
/**
 * Not bundled {@link RealmapResolvedPkg} will have
 * `resolved` field and `integrity` field (if not
 * local dependency).
 */
export type RealmapResolvedPkgNotBundled = {
    /**
     * Instruction for downloader how to obtain this package.
     */
    resolved: string;
    /**
     * A sha512 or sha1 Standard Subresource Integrity
     * string for the artifact that was unpacked in this location.
     */
    integrity?: string;
};
/**
 * Bundled {@link RealmapResolvedPkg} have `bundlingPkg` field
 * pointing to bundling {@link RealmapResolvedPkg} by {@link NpmPkgPath}
 * key of {@link Realmap}.
 */
export type RealmapResolvedPkgBundled = {
    /**
     * Points to {@link Realmap} package which bundled this dependency.
     * Bundled dependency will never be hoisted above bundler.
     */
    bundlingPkg: NpmPkgPath;
};
