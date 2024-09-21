import path from 'node:path'
import fs from 'node:fs'
import { findFileImportPkg, findFilePkgJson } from './pkg-runtime.js'
import { resolvePkgImportsImport } from './resolve-imports.js'
import { importTextToAliasAndPath } from './import-text.js'
import { resolvePkgExport } from './resolve-exports.js'






export async function resolveModuleImport({
    moduleFilePath,
    env,
    moduleFileImportText
}: {
    /**
     * Path to particular file.
     */
    moduleFilePath: string,
    /**
     * Particular import of particular file.
     */
    moduleFileImportText: string,
    /**
     * What is runtime environment?
     */
    env?: string[],
}): Promise<string | null | undefined> {

    const moduleFileRealPath = await fs.promises.realpath(
        moduleFilePath
    )

    // relative/absolute file
    if(
        moduleFileImportText.startsWith('./')
        || moduleFileImportText.startsWith('../')
        || moduleFileImportText.startsWith('/')
    ) {
        const importAbsPath = path.join(
            path.dirname(moduleFileRealPath), 
            moduleFileImportText
        )
        
        return path.relative(
            '.', // path.dirname(moduleFilePath),
            importAbsPath
        )
    }
    // imports import
    if(moduleFileImportText.startsWith('#')) {

        const {pkg} = await findFilePkgJson(moduleFileRealPath)
        if(!pkg) {
            throw new Error('For import("#...") package.json is mandatory.', {
                cause: {moduleFilePath, moduleFileRealPath}
            })
        }
        const resolved = resolvePkgImportsImport(
            moduleFileImportText,
            pkg,
            env ?? []
        )

        // restricted or not found
        if(resolved === null || resolved === undefined) {
            return resolved
        }

        // imports relative/absolute import
        if(resolved.startsWith('./')) {
            const importAbsPath = path.join(
                path.dirname(moduleFileRealPath), 
                moduleFileImportText
            )
            return path.relative(
                '.', // path.dirname(moduleFilePath), 
                importAbsPath
            )
        }

        // imports dependency import
        const {
            alias: dependencyAlias,
            path: dependencySubPath,
        } = importTextToAliasAndPath(resolved)

        const {
            pkg: dependencyPkg, 
            pkgPath: dependencyPkgPath
        } = await findFileImportPkg(
            moduleFileRealPath,
            dependencyAlias,
        )
        if(!dependencyPkg) {
            return undefined
        }

        const resolvedDependencySubPath = resolvePkgExport(
            dependencySubPath,
            dependencyPkg,
            env ?? [],
        )

        if(
            resolvedDependencySubPath === undefined 
            || resolvedDependencySubPath === null
        ) {
            return resolvedDependencySubPath
        }


        return path.relative(
            '.', // path.dirname(moduleFilePath),
            path.join(dependencyPkgPath, resolvedDependencySubPath),
        )
    }
    // exports import
    else {
        const {
            alias: moduleImportAlias,
            path: moduleImportPath,
        } = importTextToAliasAndPath(moduleFileImportText)

        const {pkg, pkgPath} = await findFileImportPkg(
            moduleFileRealPath,
            moduleImportAlias,
        )
        if(!pkg) {
            return undefined
        }

        const resolved = resolvePkgExport(
            moduleImportPath,
            pkg,
            env ?? [],
        )

        if(
            resolved === undefined 
            || resolved === null
        ) {
            return resolved
        }

        return path.relative(
            '.', // path.dirname(moduleFilePath),
            path.join(pkgPath, resolved),
        )
    }
}














