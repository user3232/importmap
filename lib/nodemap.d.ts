import { Depmap, Pakmap } from './realmap.js';
import { Pkg } from './types/types-pkg.js';
export type NodemapScope = {
    name: Pkg['name'];
    version: Pkg['version'];
    type: 'import' | 'require';
    exports?: Pkg['exports'];
    imports?: Pkg['imports'];
    dependencies?: {
        [alias: string]: string;
    } | undefined;
};
export type Nodemap = {
    imports: NodemapScope;
    scopes: {
        [scope: string]: NodemapScope;
    };
};
export declare function nodemapGlobalFrom(nodemapLocal: Nodemap, globmap: {
    [pkgDir: string]: string;
}): Nodemap;
export declare function nodemapLocalFrom(pakmap: Pakmap, depmap: Depmap, pkgJsonDir: string): Nodemap;
