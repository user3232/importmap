import { Globmap } from "./globmap.js"
import { Scopemap } from "./scopemap.js"
import { pipableObjectFrom } from "@user3232/pipable"
import { Depmap, Pakmap } from "./realmap.js"
import { Pkg } from "./types/types-pkg.js"
import npa from 'npm-package-arg'



/**
 * Maps packages real runtime paths to specs, e.g.:
 * 
 * ```json
 * {
 *   "node_modules/react": "npm:react@18.3.1",
 *   "node_modules/react-dom": "npm:react-dom@18.3.1"
 * }
 * ```
 */
export type Specmap = {
    [pkgDir: string]: string
}



export function globalizeSpecmap(
    specmap: Specmap,
    globmap: Globmap,
    scopemap: Scopemap,
): Specmap {
    return pipableObjectFrom(specmap)
    .filtermapKeys((pkgDir) => {
        const pkgDirGlob = globmap[pkgDir]
        if(
            pkgDirGlob !== undefined
            && (
                scopemap.exports[pkgDirGlob] !== undefined
                || scopemap.imports[pkgDirGlob] !== undefined
            )
        ) {
            return pkgDirGlob
        }
        return undefined
    })
    .toSortedByKey()
    .value
}



export function specmapFrom(
    pakmap: Pakmap,
    depmap: Depmap,
    pkgJsonDir: string,
    pkgSpec?: string | undefined,
): Specmap {
    const specmap: Specmap = {}

    for(const [pkgDir, pkg] of Object.entries(pakmap)) {
        const allDeps = [
            ...Object.entries(pkg.dependencies ?? {}),
            ...Object.entries(pkg.peerDependencies ?? {}),
            ...Object.entries(pkg.optionalDependencies ?? {}),
        ]
        for(const [alias, spec] of allDeps) {
            const aliasPath = depmap[pkgDir]![alias]
            if(aliasPath) {
                const aliasPkg = pakmap[aliasPath]
                if(aliasPkg) {
                    specmap[aliasPath] = specPkg(alias, spec, aliasPkg)
                }

            }
        }
    }

    if(pkgSpec !== undefined) {
        specmap[pkgJsonDir] = pkgSpec
    }
    else if(pakmap[pkgJsonDir]?.spec !== undefined) {
        specmap[pkgJsonDir] = pakmap[pkgJsonDir].spec
    }
    else {
        // 
    }


    return specmap
}






// tag:
// console.log(npa.resolve("@types/treeverse", "latest"))

// version:
// console.log(npa.resolve("@types/treeverse", "1.2.3"))

// range:
// console.log(npa.resolve("@types/treeverse", "1.x"))

// tarball file:
// console.log(npa.resolve("@types/treeverse", "something.tar.gz"))
// console.log(npa("@types/treeverse@something.tar.gz"))
// console.log(npa("something.tar.gz"))

// directory:
// console.log(npa.resolve("@types/treeverse", "./something"))

// remote:
// console.log(npa.resolve("@types/treeverse", "https://github.com/indexzero/forever/tarball/v0.5.6"))
// console.log(npa("https://github.com/indexzero/forever/tarball/v0.5.6"))

// git:
// console.log(npa.resolve("@user3232/pattern", "github:user3232/pattern#semver:latest"))
// console.log(npa.resolve("@user3232/pattern", "github:user3232/pattern"))
// console.log(npa.resolve("@user3232/pattern", "git+https://github.com/user3232/pattern.git#semver:latest"))
// console.log(npa.resolve("@user3232/pattern", "git+file:///home/mk/github/lib/pattern#semver:latest"))

// alias:
// console.log(npa.resolve("@types/treeverse", "npm:@types/treeverse@^3.0.5"))
// console.log(npa("@types/treeverse@github:types/treeverse#semver:^3.0.5"))

// alias tag:
// console.log(npa.resolve("yoyo", "npm:@types/treeverse@latest"))
// alias version:
// console.log(npa.resolve("yoyo", "npm:@types/treeverse@1.2.3"))
// alias range:
// console.log(npa.resolve("yoyo", "npm:@types/treeverse@1.x"))

export function specPkg(
    alias: string,
    spec: string,
    pkg: Pkg,
): string {
    const resolvedSpec = npa.resolve(alias, spec)
    
    switch(resolvedSpec.type) {
        // file:something.tar.gz
        case 'file': 
        // file:something
        case 'directory': 
        // https://example.org/something.tgz
        case 'remote': {
            return resolvedSpec.saveSpec
        }
        // git+https://github.com/user/project.git#semver:1.2.3
        // git+file:///home/user/projects/project#semver:1.2.3
        // github:user/project.git#semver:1.2.3
        case 'git': {
            const hashIndex = resolvedSpec.saveSpec.lastIndexOf('#')
            const saveSpecWithoutRange = hashIndex !== -1 
                ? resolvedSpec.saveSpec.slice(0, hashIndex)
                : resolvedSpec.saveSpec
            return `${saveSpecWithoutRange}#semver:${pkg.version}`
        }
        // npm:something@1.2.3
        case 'version': 
        // npm:something@^1.2
        case 'range': 
        // npm:something@latest
        case 'tag': {
            return `npm:${resolvedSpec.name}@${pkg.version}`
        }
        case 'alias': {
            switch(resolvedSpec.subSpec.type) {
                case 'file': 
                case 'directory': 
                case 'git': 
                case 'remote':
                case 'alias': {
                    console.log({
                        type: 'Error: specPkg alias is not "npm:"',
                        resolvedSpec
                    })
                    return ''
                }
                case 'version': 
                case 'range': 
                case 'tag': {
                    return `npm:${resolvedSpec.subSpec.name}@${pkg.version}`
                }
            }
        }
    }
}

