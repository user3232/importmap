import { Globmap } from "./globmap.js";
import { Scopemap } from "./scopemap.js";
import { Depmap, Pakmap } from "./realmap.js";
import { Pkg } from "./types/types-pkg.js";
/**
 * Maps packages real runtime paths to specs, e.g.:
 *
 * ```json
 * {
 *   "node_modules/react": "npm:react@18.3.1",
 *   "node_modules/react-dom": "npm:react-dom@18.3.1"
 * }
 * ```
 */
export type Specmap = {
    [pkgDir: string]: string;
};
export declare function globalizeSpecmap(specmap: Specmap, globmap: Globmap, scopemap: Scopemap): Specmap;
export declare function specmapFrom(pakmap: Pakmap, depmap: Depmap, pkgJsonDir: string, pkgSpec?: string | undefined): Specmap;
export declare function specPkg(alias: string, spec: string, pkg: Pkg): string;
