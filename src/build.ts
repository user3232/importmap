import { nodemapGlobalFrom, nodemapLocalFrom } from './nodemap.js'
import { filemapFrom, filemapGlobalFrom } from './filemap.js'
import { realmapFromFs } from './realmap.js'
import { globalizeIntegritymap, integritymapFrom } from './integritymap.js'
import { globmapFrom } from './globmap.js'
import { globalizeSpecmap, Specmap, specmapFrom } from './specmap.js'
import { Importmap, importmapFrom } from './importmap.js'
import { scopemapFrom } from './scopemap.js'



export async function buildImprtmap(
    env: string[],
    pkgJsonDir: string,
    baseUrl?: string | undefined,
    pkgSpec?: string | undefined,
): Promise<{
    local: Importmap;
    global: Importmap;
    spec: Specmap;
    pkgJsonGlobDir: string;
}> {

    const { pakmap, depmap, } = await realmapFromFs(pkgJsonDir)
    const specmap = specmapFrom(
        pakmap,
        depmap,
        pkgJsonDir,
        pkgSpec
    )


    const nodemapLocal = nodemapLocalFrom(pakmap, depmap, pkgJsonDir)
    const filemapLocal = await filemapFrom(pakmap, pkgJsonDir)
    const scopemapLocal = scopemapFrom(
        env,
        filemapLocal,
        nodemapLocal,
        pkgJsonDir
    )
    const integritymapLocal = await integritymapFrom(
        [
            ...Object.keys(scopemapLocal.exports),
            ...Object.keys(scopemapLocal.imports),
        ],
        filemapLocal,
        'sha256'
    )
    const importmapLocal = importmapFrom(
        nodemapLocal, 
        scopemapLocal, 
        integritymapLocal,
        pkgJsonDir, 
        baseUrl
    )
    

    const globmap = await globmapFrom(pakmap, depmap, pkgJsonDir)
    const pkgJsonGlobDir = globmap[pkgJsonDir]!
    const nodemapGlobal = nodemapGlobalFrom(nodemapLocal, globmap)
    const filemapGlobal = filemapGlobalFrom(filemapLocal, globmap)
    const scopemapGlobal = scopemapFrom(
        env,
        filemapGlobal,
        nodemapGlobal,
        pkgJsonGlobDir
    )
    const integritymapGlobal = globalizeIntegritymap(
        integritymapLocal,
        globmap
    )
    const importmapGlobal = importmapFrom(
        nodemapGlobal, 
        scopemapGlobal, 
        integritymapGlobal,
        pkgJsonGlobDir, 
        baseUrl
    )
    
    const specmapGlobal = globalizeSpecmap(
        specmap,
        globmap,
        scopemapGlobal,
    )



    return {
        local: importmapLocal,
        global: importmapGlobal,
        spec: specmapGlobal,
        pkgJsonGlobDir,
    }
}


