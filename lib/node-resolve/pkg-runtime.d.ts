import { Pkg } from '../types/types-pkg.js';
export declare function findFileImportPkg(
/**
 * Path to particular file.
 */
moduleFilePath: string, 
/**
 * Import alias of particular file.
 */
moduleFileImportAlias: string): Promise<{
    pkg: Pkg;
    pkgPath: string;
} | {
    pkg: null;
    pkgPath: null;
}>;
export declare function findFilePkgJson(modulePath: string): Promise<{
    pkg: Pkg;
    pkgDir: string;
} | {
    pkg: null;
    pkgDir: null;
}>;
