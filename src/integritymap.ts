import fs from 'node:fs'
import { createHash } from 'node:crypto'
import stream from 'node:stream'
import path from 'node:path'
import { type Filemap } from './filemap.js'
import { type Globmap } from './globmap.js'
import { pipableObjectFrom } from '@user3232/pipable'





/**
 * Maps file to subresource integrity, e.g.
 * 
 * ```json
 * {
 *   "node_modules/proc-log/README.md": "sha256-sGRLMKcFpdrTj-VExtYN0NP9HoZ13LC60bQtY-usug8",
 *   "node_modules/proc-log/LICENSE": "sha256-3DKg3uJ14Kmu_7yXTb9ImaMNzcLl_6iTSuy2kmEGWGQ"
 * }
 * ```
 */
export type Integritymap = {
    [pkgPath: string]: {
        [filePath: string]: string
    }
}

export function globalizeIntegritymap(
    integritymap: Integritymap,
    globmap: Globmap,
): Integritymap {

    return pipableObjectFrom(integritymap)
    .filtermapKeys((key) => globmap[key])
    .value

}


export async function integritymapFrom(
    pkgsDirs: string[],
    filemap: Filemap,
    algorithm: 'sha256' | 'sha384' | 'sha512'
): Promise<Integritymap> {

    const filteredFilemap: Filemap = {}
    for(const pkgDir of pkgsDirs) {
        if(filemap[pkgDir]) {
            filteredFilemap[pkgDir] = filemap[pkgDir]
        }
    }

    const intEntries = await Promise.all(
        Object.entries(filteredFilemap)
        .map(async ([pkgPath, files]) => {
    
            const pkgFilesIntegrity = Object.fromEntries(
                await Promise.all(
                    files.map(async (file) => [
                        file,
                        await fileIntegrity(path.join(pkgPath, file), algorithm)
                    ]) as Promise<[string, string]>[]
                )
            )
    
            return [
                pkgPath,
                pkgFilesIntegrity,
            ] as [string, {[file: string]: string}]
        })
    )

    return Object.fromEntries(intEntries)
}


export async function fileIntegrity(
    filePath: string,
    algorithm: 'sha256' | 'sha384' | 'sha512'
): Promise<string> {

    const hash = createHash(algorithm)
    const fileSource = fs.createReadStream(filePath)

    await stream.promises.pipeline(
        fileSource,
        hash,
    )

    return `${algorithm}-${hash.digest('base64url')}`
}

