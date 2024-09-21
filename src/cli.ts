import { glob } from 'glob'
import { buildImprtmap } from './build.js'
import fs from 'node:fs'
import { importmapRebase } from './importmap.js'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import {parse} from 'node-html-parser'






export async function cli(
    argv?: string[] | undefined
): Promise<void> {
    const commandArgs = commandLineArgs(
        [
            { 
                name: 'command', 
                defaultOption: true 
            }
        ], 
        {
            stopAtFirstUnknown: true,
            argv,
        }
    ) as {
        _unknown?: string[],
        command?: string,
    }

    

    switch(commandArgs.command) {
        case 'help': {
            return console.log(helpImportmapCli)
        }
        case 'build': {
            const {env} = commandLineArgs(
                [
                    { 
                        name: 'env', 
                        defaultOption: true,
                        type: String,
                        multiple: true,
                    }
                ], 
                {
                    argv: commandArgs._unknown,
                }
            ) as {
                env?: string[],
            }
            
            return await cliImportmap('.', env)
        }
        case 'rebase': {
            const args = commandLineArgs(
                [
                    { 
                        name: 'base-path', 
                        defaultOption: true,
                        type: String,
                    },
                    {
                        name: 'origin',
                        type: String,
                    },
                    {
                        name: 'local',
                        type: Boolean,
                        defaultValue: false
                    },
                    {
                        name: 'no-global',
                        type: Boolean,
                        defaultValue: false
                    },
                ], 
                {
                    argv: commandArgs._unknown,
                }
            ) as {
                'base-path'?: string,
                local: boolean,
                'no-global': boolean,
                origin?: string,
            }
            return await cliRebase(
                args['base-path'] ?? '/', 
                args.origin,
                !args['no-global'], 
                args.local, 
                '.'
            )
        }
        case 'inject': {
            const injectArgs = commandLineArgs(
                [
                    { 
                        name: 'importmap', 
                        defaultOption: true,
                        type: String,
                    }
                ], 
                {
                    argv: commandArgs._unknown,
                    stopAtFirstUnknown: true,
                }
            ) as {
                importmap?: string | undefined,
                _unknown?: string[] | undefined,
            }

            if(!injectArgs.importmap) {
                console.log('importmap inject: importfile file must be provided!')
                return
            }
            
            const injectHtmlsArgs = commandLineArgs(
                [
                    { 
                        name: 'html', 
                        defaultOption: true,
                        multiple: true,
                        type: String,
                    }
                ], 
                {
                    argv: injectArgs._unknown,
                }
            ) as {
                html?: string[] | undefined,
                _unknown?: string[] | undefined,
            }

            if(!injectHtmlsArgs.html) {
                console.log('importmap inject: html(s) file(s) must be provided!')
                return
            }

            return await cliImportmapInjectHtml(
                injectArgs.importmap,
                injectHtmlsArgs.html,
            )
        }
        default: {
            return console.log(helpImportmapCli)
        }
    }


}




const helpImportmapCli = commandLineUsage([
    {
        header: `importmap`,
        content: `Provides operations for generating importmaps from "package.json" and "node_modules".`,        
    },
    {
        header: `Synopsis`,
        content: [
            `$ importmap {bold help}`,
            `$ importmap {bold build} [[{bold --env}] {underline scope}]*`,
            `$ importmap {bold rebase} [[{bold --base-path}] {underline path}] [{bold --origin} {underline origin}] [{bold --no-global}] [{bold --local}]`,
            `$ importmap {bold inject} [{bold --importmap}] {underline path} [[{bold --html}] {underline path}]+`,
        ]
    },
    {
        header: `Examples`,
        content: [
            `Display help`,
            `$ importmap help`,
            ``,
            `Generate importmaps working in environment heavin browser and import features.`,
            `$ importmap build browser import`,
            ``,
            `Rebase global and local importmaps with origin http://localhost:3000 and base path "/".`,
            `$ importmap rebase --local --origin http://localhost:3000 /`,
            ``,
            `Injects importmap to html files`,
            `$ importmap inject [import].local.importmap.json *.html`,
        ]
    },
    {
        header: `Commands`,
        content: [
            {
                command: `help`,
                arg: ``,
                summary: `This help.`
            },
            {
                command: `build`,
                arg: ``,
                summary: `Analizes current directory "package.json" and "node_modules" and generates importmaps.`,
            },
            {
                command: `build`,
                arg: `[[{bold --env}] {underline env}]*`,
                summary: `Enviroment features. If none provided "import" is used.`,
            },
            {
                command: `rebase`,
                arg: `[[{bold --base-path}] {underline path}]`,
                summary: `Sets base url for every file and scope. Overrides importmap's files. When base-path not provided, uses /.`
            },
            {
                command: `rebase`,
                arg: `[{bold --origin} {underline origin}]`,
                summary: `origin option adds origin when rebasing importmaps.`
            },
            {
                command: `rebase`,
                arg: `[{bold --no-global}]`,
                summary: `no-global option stops rebase of global importmaps.`
            },
            {
                command: `rebase`,
                arg: `[{bold --local}]`,
                summary: `local option rebases local importmaps.`
            },
            {
                command: `inject`,
                arg: `[{bold --importmap}] {underline path}`,
                summary: `Specifyies importmap to inject`
            },
            {
                command: `inject`,
                arg: `[{bold --html}] {underline path}`,
                summary: `Html files paths for which inject importmap`
            },
        ]
    },
])






export const ImportmapExt = {
    spec: '.importmap.spec.json',
    local: '.importmap.local.json',
    global: '.importmap.global.json',
    bare: '.',
} as const



export async function cliImportmap(
    cwd?: string | undefined,
    env?: string[] | undefined
): Promise<void> {
    cwd ??= '.'
    env ??= ['import']
    const pkgJsonDir = cwd
    const baseUrl = cwd

    const {local, global, spec, pkgJsonGlobDir,} = await buildImprtmap(
        env,
        pkgJsonDir, 
        baseUrl,
    )
    
    const envString = env.toSorted().join(',')
    const importmapName = pkgJsonGlobDir.replace('/', '__')
    

    // 'importmap[browser,import].local.json'
    // 'importmap[browser,import].global.json'
    // 'importmap[browser,import].re.local.json'
    // 'importmap[browser,import].re.global.json'
    // '@user3232__importmap@1.0.1:LKJ98hhJSD.importmap[browser,import].spec.json'
    

    await fs.promises.writeFile(
        `${ImportmapExt.bare}[${envString}]${ImportmapExt.local}`, 
        JSON.stringify(local, undefined, 2)
    )
    console.log(`importmap build: Created bare local importmap at: ${ImportmapExt.bare}[${envString}]${ImportmapExt.local}`)


    await fs.promises.writeFile(
        `${ImportmapExt.bare}[${envString}]${ImportmapExt.global}`, 
        JSON.stringify(global, undefined, 2)
    )
    console.log(`importmap build: Created bare global importmap at: ${ImportmapExt.bare}[${envString}]${ImportmapExt.global}`)


    await fs.promises.writeFile(
        `${importmapName}.[${envString}]${ImportmapExt.spec}`, 
        JSON.stringify(spec, undefined, 2)
    )
    console.log(`importmap build: Created global importmap spec at: ${importmapName}.[${envString}]${ImportmapExt.spec}`)


    const relocal = importmapRebase(local, '/')
    await fs.promises.writeFile(
        `[${envString}]${ImportmapExt.local}`, 
        JSON.stringify(relocal, undefined, 2)
    )
    console.log(`importmap build: Created local importmap rebased to "/" at: [${envString}]${ImportmapExt.local}`)


    const reglobal = importmapRebase(global, '/')
    await fs.promises.writeFile(
        `[${envString}]${ImportmapExt.global}`, 
        JSON.stringify(reglobal, undefined, 2)
    )
    console.log(`importmap build: Created global importmap rebased to "/" at: [${envString}]${ImportmapExt.global}`)
}





export async function cliRebase(
    baseUrl: string,
    origin?: string | undefined,
    global?: boolean | undefined,
    local?: boolean | undefined,
    cwd?: string | undefined
): Promise<void> {
    cwd ??= '.'

    

    const globPatterns: string[] = []
    if(global) {
        globPatterns.push(`${ImportmapExt.bare}*${ImportmapExt.global}`)
    }
    if(local) {
        globPatterns.push(`${ImportmapExt.bare}*${ImportmapExt.local}`)
    }
    const importmapsFiles = await glob(globPatterns, {cwd})
    if(importmapsFiles.length === 0) {
        console.log('importmap rebase: no importmap files. Nothing to do.')
        return
    }

    for(const importmapFile of importmapsFiles) {
        console.log(`importmap rebase: rebasing from ${importmapFile}`)
    }

    const remaps = importmapsFiles.map(async (importmapFile) => {
        const importmap = JSON.parse(await fs.promises.readFile(
            importmapFile,
            {encoding: 'utf8'}
        ))
        const importmapRe = importmapRebase(importmap, baseUrl, origin)
        await fs.promises.writeFile(
            importmapFile.slice(ImportmapExt.bare.length),
            JSON.stringify(importmapRe, undefined, 2),
            'utf8'
        )
    })
    .map((remap) => remap.catch(
        (err) => new Error('importmap rebase: rebasing problem!', {cause: err}))
    )

    const remappeds = await Promise.all(remaps)
    const remappedsErrors = remappeds.filter((remapped) => remapped instanceof Error)
    if(remappedsErrors.length !== 0) {
        console.log('importmap rebase: rebasing problems!')
        remappedsErrors.forEach((fetchError) => console.log(fetchError))
    }

    console.log('importmap rebase: done.')
}














// await fsImportmapInject(
//     htmlsFiles,
//     importmapFile
// )

export async function cliImportmapInjectHtml(
    importmapFile: string,
    htmlsFiles: string[],
): Promise<void> {
    if(htmlsFiles.length === 0) {
        console.log('importmap inject: Nothing to do, no html\'s.')
        return
    }

    const importmap = await fs.promises.readFile(
        importmapFile,
        {encoding: 'utf8'}
    ).catch((err) => err instanceof Error 
        ? err
        : new Error('Reading importmap file error', {
            cause: {
                importmapFile,
                reason: err,
            }
        })
    )

    if(importmap instanceof Error) {
        console.log('importmap inject: Loading importmap failed.')
        console.error(importmap)
        return
    }


    const htmlsOperations = htmlsFiles.map(async (htmlFile) => {
        const html = await fs.promises.readFile(
            htmlFile,
            {encoding: 'utf8'}
        )
        const newHtml = importmapInjectHtml(importmap, html)
        if(newHtml) {
            await fs.promises.writeFile(
                htmlFile,
                newHtml,
                {encoding: 'utf8'}
            )
            console.log(`importmap inject: ${htmlFile} done!`)
        }
        else {
            console.log(`importmap inject: ${htmlFile} nothing to do!`)
        }
    })
    .map((operation) => {
        operation.catch((err) => {
            console.log('importmap inject: file operation error.')
            console.error(err)
        })
    })

    await Promise.all(htmlsOperations)





    function importmapInjectHtml(
        importmap: string,
        html: string,
    ): string | null {
        const root = parse(html)
        const importmapNode = root.querySelector('script[type="importmap"]')
        if(!importmapNode) {
            return null
        }
        importmapNode.set_content('\n' + importmap + '\n')
        return root.toString()
    }
}




