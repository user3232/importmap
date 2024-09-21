import { Nodemap } from './nodemap.js';
import { Filemap } from './filemap.js';
export type Scopemap = {
    exports: {
        [pkgUrl: string]: {
            [exportsSubpath: string]: string | null;
        };
    };
    imports: {
        [pkgUrl: string]: {
            [importText: string]: string | null;
        };
    };
};
export declare function scopemapFrom(env: string[], filemap: Filemap, nodemap: Nodemap, pkgJsonDir?: string | undefined): Scopemap;
export type EnvResolvedPkgImports = {
    [subpath: string]: string | null;
};
export type EnvResolvedPkgExports = {
    [subpath: string]: string | null;
};
