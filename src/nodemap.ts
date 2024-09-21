import { Depmap, Pakmap } from './realmap.js'
import { Pkg, PkgExports, PkgFile } from './types/types-pkg.js'


// const pkgJsonDir = '.'
// import { realmapFromFs } from './realmap.js'
// const {pakmap, depmap, globmap, specmap } = await realmapFromFs(pkgJsonDir)
// const nodemapLocal = generateNodemapLocal(pakmap, depmap, pkgJsonDir)
// const nodemapGlobal = nodemapGlobalize(nodemapLocal, globmap)
// console.log(nodemapGlobal)




export type NodemapScope = {
    name: Pkg['name'],
    version: Pkg['version'],
    type: 'import' | 'require'
    exports?: Pkg['exports'],
    imports?: Pkg['imports'],
    dependencies?: {
        [alias: string]: string
    } | undefined
}

export type Nodemap = {
    imports: NodemapScope,
    scopes: {
        [scope: string]: NodemapScope
    }
}


export function nodemapGlobalFrom(
    nodemapLocal: Nodemap,
    globmap: {
        [pkgDir: string]: string;
    },
): Nodemap {
    
    const nodemapGlobalScopes: Nodemap['scopes'] = {}

    for(const [pkgDir, scopeValue] of Object.entries(nodemapLocal.scopes)) {
        const globalizedDependencies = Object.fromEntries(
            Object.entries(scopeValue.dependencies ?? {})
            .map(([alias, pkgDir]) => [alias, globmap[pkgDir]!])
        )
        const pkgDirGlobal = globmap[pkgDir]!
        nodemapGlobalScopes[pkgDirGlobal] = {
            ...scopeValue,
            dependencies: globalizedDependencies
        }
    }

    const nodemapGlobalImportsDependencies = Object.fromEntries(
        Object.entries(nodemapLocal.imports.dependencies ?? {})
        .map(([alias, pkgDir]) => [alias, globmap[pkgDir]!])
    )

    const nodemapGlobalImports: Nodemap['imports'] = {
        ...nodemapLocal.imports,
        dependencies: nodemapGlobalImportsDependencies,
    }
    
    const nodemapGlobal: Nodemap = {
        imports: nodemapGlobalImports,
        scopes: nodemapGlobalScopes
    }

    return nodemapGlobal
}





export function nodemapLocalFrom(
    pakmap: Pakmap,
    depmap: Depmap,
    pkgJsonDir: string
): Nodemap {
    
    const nodemapLocalScopes: Nodemap['scopes'] = {}

    for(const pkgPath of Object.keys(pakmap)) {
        const pkg = pakmap[pkgPath]!
        const dependencies = depmap[pkgPath]!

        const local: NodemapScope = {
            name: pkg.name,
            version: pkg.version,
            type: pkg.type === 'module' ? 'import' : 'require'
        }
        if(pkg.exports) local.exports = pkg.exports
        if(pkg.imports) local.imports = pkg.imports
        if(Object.entries(dependencies).length !== 0) local.dependencies = dependencies
        if(!pkg.exports) {
            const pkgExports = resolvePkgWithoutExports(pkg.main, pkg.type)
            if(pkgExports !== undefined) {
                local.exports = pkg.main as PkgFile
            }
        }

        nodemapLocalScopes[pkgPath] = local
    }

    const nodemapLocal: Nodemap = {
        imports: nodemapLocalScopes[pkgJsonDir] ?? {name: '', version: '', type: 'require'},
        scopes: nodemapLocalScopes
    }

    return nodemapLocal
}




function resolvePkgWithoutExports(
    fileOrDir: string | null | undefined,
    type: 'module' | 'commonjs' | undefined
): PkgExports | undefined {
    const file = dotRelativeFilePath(fileOrDir)
    if(file === undefined) {
        return undefined
    }
    else if(file === null) {
        return {
            '.': file
        }
    }
    if(file.endsWith('.mjs')) {
        return {
            '.': {
                'import': file
            }
        }
    }
    else if(file.endsWith('.cjs')) {
        return {
            '.': {
                'require': file
            }
        }
    }
    else if(file.endsWith('.js')) {
        return {
            '.': {
                [type === 'module' ? 'import' : 'require']: file
            }
        }
    }
    else if(file.endsWith('.json')) {
        return {
            '.': file
        }
    }
    else {
        return {
            '.': file
        }
    }
}


function dotRelativeFilePath(
    path: string | null | undefined
): PkgFile | null | undefined {
    if(path === null || path === undefined) {
        return path
    }
    else if(path.endsWith('/')) {
        return undefined
    }
    else if(
        path.startsWith('./') 
        || path.startsWith('../') 
        || path.startsWith('/')
    ) {
        return path as PkgFile
    }
    else if(path === '.') {
        return undefined
    }
    else if(path === '..') {
        return undefined
    }
    else {
        return `./${path}`
    }
}
