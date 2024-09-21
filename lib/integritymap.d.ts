import { type Filemap } from './filemap.js';
import { type Globmap } from './globmap.js';
/**
 * Maps file to subresource integrity, e.g.
 *
 * ```json
 * {
 *   "node_modules/proc-log/README.md": "sha256-sGRLMKcFpdrTj-VExtYN0NP9HoZ13LC60bQtY-usug8",
 *   "node_modules/proc-log/LICENSE": "sha256-3DKg3uJ14Kmu_7yXTb9ImaMNzcLl_6iTSuy2kmEGWGQ"
 * }
 * ```
 */
export type Integritymap = {
    [pkgPath: string]: {
        [filePath: string]: string;
    };
};
export declare function globalizeIntegritymap(integritymap: Integritymap, globmap: Globmap): Integritymap;
export declare function integritymapFrom(pkgsDirs: string[], filemap: Filemap, algorithm: 'sha256' | 'sha384' | 'sha512'): Promise<Integritymap>;
export declare function fileIntegrity(filePath: string, algorithm: 'sha256' | 'sha384' | 'sha512'): Promise<string>;
