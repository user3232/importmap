import { Depmap, Pakmap } from './realmap.js';
/**
 * Maps packages real runtime paths to global names.
 * Global name of package real runtime directory:
 *
 * * for packages without `dependencies`, `peerDependencies`
 *   and `optionalDependencies` is package name and version
 *   of its `package.json`,
 * * for packages without cyclic dependencies is package name and version
 *   of its `package.json` and hash ({@link stringToSha256To10BToBase64Url})
 *   of its dependencies (in order as in `package.json`) mapped to global names.
 *
 * > **Note**
 * >
 * > This means package global name glues package with
 * > exact dependencies.
 *
 * Example:
 *
 * ```json
 * {
 *   "node_modules/react": "react@18.3.1",
 *   "node_modules/react-dom": "react-dom@18.3.1:bvAndLAvDYeWRg"
 * }
 * ```
 */
export type Globmap = {
    [pkgDir: string]: string;
};
export declare function globmapFrom(pakmap: Pakmap, depmap: Depmap, pkgDir?: string | undefined): Promise<Globmap>;
