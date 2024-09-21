// import assert from 'node:assert'
import test from 'node:test'
import { resolveModuleImport } from '../src/node-resolve/node-resolve.js'


test('resolveModuleImport', async (t) => {

    await t.test(
        'Resolving modules imports works.', 
        {
            skip: 'Only console.log', 
        },
        displayExemplaryResolutions,
    )



})


async function displayExemplaryResolutions() {
    
    console.log(await resolveModuleImport({
        moduleFileImportText: './index.ts',
        moduleFilePath: './src/resolve-module-import.ts',
        env: [],
    }))
    console.log(await resolveModuleImport({
        moduleFileImportText: '@user3232/pattern',
        moduleFilePath: './src/resolve-module-import.ts',
        env: ['import'],
    }))
    console.log(await resolveModuleImport({
        moduleFileImportText: '@user3232/mime/db.js',
        moduleFilePath: './src/resolve-module-import.ts',
        env: ['import'],
    }))


    console.log( await resolveModuleImport({
        moduleFilePath: 'node_modules/@user3232/mime/lib/mime-db/index.js',
        moduleFileImportText: '@user3232/pattern',
        env: ['import'],
    }))
    

}