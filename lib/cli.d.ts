export declare function cli(argv?: string[] | undefined): Promise<void>;
export declare const ImportmapExt: {
    readonly spec: ".importmap.spec.json";
    readonly local: ".importmap.local.json";
    readonly global: ".importmap.global.json";
    readonly bare: ".";
};
export declare function cliImportmap(cwd?: string | undefined, env?: string[] | undefined): Promise<void>;
export declare function cliRebase(baseUrl: string, origin?: string | undefined, global?: boolean | undefined, local?: boolean | undefined, cwd?: string | undefined): Promise<void>;
export declare function cliImportmapInjectHtml(importmapFile: string, htmlsFiles: string[]): Promise<void>;
