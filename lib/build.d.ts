import { Specmap } from './specmap.js';
import { Importmap } from './importmap.js';
export declare function buildImprtmap(env: string[], pkgJsonDir: string, baseUrl?: string | undefined, pkgSpec?: string | undefined): Promise<{
    local: Importmap;
    global: Importmap;
    spec: Specmap;
    pkgJsonGlobDir: string;
}>;
