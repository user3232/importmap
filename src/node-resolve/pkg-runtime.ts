import path from 'node:path'
import fs from 'node:fs'
import { Pkg } from '../types/types-pkg.js'



export async function findFileImportPkg(
    /**
     * Path to particular file.
     */
    moduleFilePath: string,
    /**
     * Import alias of particular file.
     */
    moduleFileImportAlias: string,
): Promise<{
    pkg: Pkg,
    pkgPath: string,
} | {
    pkg: null,
    pkgPath: null,
}> {

    let currentDirPath = path.dirname(moduleFilePath)

    while(true) {

        // node_modules dir
        const bundledPkgPath = path.join(
            currentDirPath, 
            'node_modules', 
            moduleFileImportAlias,
        )
        const bundledPkg = await fs.promises.readFile(
            path.join(bundledPkgPath, 'package.json'),
            {encoding: 'utf8'}
        )
        .then((json) => JSON.parse(json) as Pkg)
        .catch(() => null)
        if(bundledPkg) {
            return {
                pkg: bundledPkg, 
                pkgPath: bundledPkgPath
            }
        }
    
        // pkg
        const parentPkgPath = path.join(currentDirPath, 'package.json')
        const parentPkg = await fs.promises.readFile(
            parentPkgPath,
            {encoding: 'utf8'}
        )
        .then((json) => JSON.parse(json) as Pkg)
        .catch(() => null)
        if(parentPkg && parentPkg.name === moduleFileImportAlias) {
            return {pkg: parentPkg, pkgPath: currentDirPath}
        }

        // nothing new will happen so exit
        if(currentDirPath === '.' || currentDirPath === '/') {
            return {
                pkg: null, 
                pkgPath: null
            }
        }

        // go to parent
        currentDirPath = path.dirname(currentDirPath)

    }  

}





export async function findFilePkgJson(
    modulePath: string
): Promise<{
    pkg: Pkg,
    pkgDir: string,
} | {
    pkg: null,
    pkgDir: null,
}> {

    let dirPath = path.dirname(modulePath)

    while(true) {
        
        const pkgJson = await fs.promises.readFile(
            path.join(dirPath, 'package.json'),
            {encoding: 'utf8'}
        )
        .then((pkgJson) => JSON.parse(pkgJson) as Pkg)
        .catch(() => null)
        if(pkgJson) {
            return {
                pkgDir: dirPath,
                pkg: pkgJson
            }
        }

        // nothing new will happen so exit
        if(dirPath === '.' || dirPath === '/') {
            return {
                pkgDir: null,
                pkg: null
            }
        }

        // go to parent
        dirPath = path.dirname(dirPath)
    }
}



