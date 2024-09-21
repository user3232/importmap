import { type Pakmap } from './realmap.js';
import { type Globmap } from './globmap.js';
export declare function filemapGlobalFrom(filemap: Filemap, globmap: Globmap): Filemap;
/**
 * Maps package real path to list of its **importable** files
 * (`.cjs`, `.mjs`, `.js`, `.json`), e.g.
 *
 * ```json
 * {
 *   "node_modules/react": [
 *     "package.json",
 *     "esm/index.development.js",
 *     "esm/index.production.js",
 *     "cjs/index.development.js",
 *     "cjs/index.production.js"
 *   ],
 *   "node_modules/@org/pkg": [
 *     "index.mjs",
 *     "index.cjs",
 *     "package.json"
 *   ]
 * }
 * ```
 */
export type Filemap = {
    [pkgDir: string]: ImportableFile[];
};
export type ImportableFile = `${string}.js` | `${string}.mjs` | `${string}.cjs`;
export declare function filemapFrom(pakmap: Pakmap, rootPkgDir?: string | undefined): Promise<Filemap>;
