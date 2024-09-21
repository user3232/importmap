import { Nodemap } from './nodemap.js';
import { Integritymap } from './integritymap.js';
import { Scopemap } from './scopemap.js';
export type Importmap = {
    imports?: {
        [importText: string]: string | null;
    };
    scopes?: {
        [pkgUrl: string]: {
            [importText: string]: string | null;
        };
    };
    integrity?: {
        [moduleUrl: string]: string;
    };
};
export declare function importmapFrom(nodemap: Nodemap, scopemap: Scopemap, integritymap: Integritymap, pkgJsonDir?: string | undefined, baseUrl?: string | undefined): Importmap;
export declare function importmapRebase(importmap: Importmap, basePath: string, origin?: string | undefined): Importmap;
