export declare function resolveModuleImport({ moduleFilePath, env, moduleFileImportText }: {
    /**
     * Path to particular file.
     */
    moduleFilePath: string;
    /**
     * Particular import of particular file.
     */
    moduleFileImportText: string;
    /**
     * What is runtime environment?
     */
    env?: string[];
}): Promise<string | null | undefined>;
