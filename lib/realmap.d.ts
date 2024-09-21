import { Pkg } from './types/types-pkg.js';
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
        [alias: string]: typeof pkgJsonDir;
    };
};
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
    [pkgJsonDir: string]: Pkg;
};
/**
 * Resolves all dependencies
 */
export declare function realmapFromFs(pkgJsonDir?: string | undefined): Promise<{
    pakmap: Pakmap;
    depmap: Depmap;
}>;
