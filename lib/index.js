// src/nodemap.ts
function nodemapGlobalFrom(nodemapLocal, globmap) {
  const nodemapGlobalScopes = {};
  for (const [pkgDir, scopeValue] of Object.entries(nodemapLocal.scopes)) {
    const globalizedDependencies = Object.fromEntries(
      Object.entries(scopeValue.dependencies ?? {}).map(([alias, pkgDir2]) => [alias, globmap[pkgDir2]])
    );
    const pkgDirGlobal = globmap[pkgDir];
    nodemapGlobalScopes[pkgDirGlobal] = {
      ...scopeValue,
      dependencies: globalizedDependencies
    };
  }
  const nodemapGlobalImportsDependencies = Object.fromEntries(
    Object.entries(nodemapLocal.imports.dependencies ?? {}).map(([alias, pkgDir]) => [alias, globmap[pkgDir]])
  );
  const nodemapGlobalImports = {
    ...nodemapLocal.imports,
    dependencies: nodemapGlobalImportsDependencies
  };
  const nodemapGlobal = {
    imports: nodemapGlobalImports,
    scopes: nodemapGlobalScopes
  };
  return nodemapGlobal;
}
function nodemapLocalFrom(pakmap, depmap, pkgJsonDir) {
  const nodemapLocalScopes = {};
  for (const pkgPath of Object.keys(pakmap)) {
    const pkg = pakmap[pkgPath];
    const dependencies = depmap[pkgPath];
    const local = {
      name: pkg.name,
      version: pkg.version,
      type: pkg.type === "module" ? "import" : "require"
    };
    if (pkg.exports) local.exports = pkg.exports;
    if (pkg.imports) local.imports = pkg.imports;
    if (Object.entries(dependencies).length !== 0) local.dependencies = dependencies;
    if (!pkg.exports) {
      const pkgExports = resolvePkgWithoutExports(pkg.main, pkg.type);
      if (pkgExports !== void 0) {
        local.exports = pkg.main;
      }
    }
    nodemapLocalScopes[pkgPath] = local;
  }
  const nodemapLocal = {
    imports: nodemapLocalScopes[pkgJsonDir] ?? { name: "", version: "", type: "require" },
    scopes: nodemapLocalScopes
  };
  return nodemapLocal;
}
function resolvePkgWithoutExports(fileOrDir, type) {
  const file = dotRelativeFilePath(fileOrDir);
  if (file === void 0) {
    return void 0;
  } else if (file === null) {
    return {
      ".": file
    };
  }
  if (file.endsWith(".mjs")) {
    return {
      ".": {
        "import": file
      }
    };
  } else if (file.endsWith(".cjs")) {
    return {
      ".": {
        "require": file
      }
    };
  } else if (file.endsWith(".js")) {
    return {
      ".": {
        [type === "module" ? "import" : "require"]: file
      }
    };
  } else if (file.endsWith(".json")) {
    return {
      ".": file
    };
  } else {
    return {
      ".": file
    };
  }
}
function dotRelativeFilePath(path8) {
  if (path8 === null || path8 === void 0) {
    return path8;
  } else if (path8.endsWith("/")) {
    return void 0;
  } else if (path8.startsWith("./") || path8.startsWith("../") || path8.startsWith("/")) {
    return path8;
  } else if (path8 === ".") {
    return void 0;
  } else if (path8 === "..") {
    return void 0;
  } else {
    return `./${path8}`;
  }
}

// src/filemap.ts
import { glob } from "glob";
import path from "node:path";
function filemapGlobalFrom(filemap, globmap) {
  const globalFilemap = {};
  for (const pkgDir of Object.keys(filemap)) {
    const pkgDirGlob = globmap[pkgDir];
    if (pkgDirGlob !== void 0) {
      const pkgFiles = filemap[pkgDirGlob];
      if (pkgFiles !== void 0) {
        globalFilemap[pkgDirGlob] = pkgFiles;
      }
    }
  }
  return globalFilemap;
}
async function filemapFrom(pakmap, rootPkgDir) {
  rootPkgDir ??= ".";
  return Object.fromEntries(
    await Promise.all(
      Object.keys(pakmap).map(async (pkgDir) => [
        pkgDir,
        await glob(
          ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.json"],
          {
            nodir: true,
            cwd: path.join(pkgDir, rootPkgDir),
            ignore: [
              "node_modules/**",
              "node_packages/**"
            ]
            // dotRelative: true
          }
        )
      ])
    )
  );
}

// src/realmap.ts
import fs from "node:fs";
import treeverse from "treeverse";
import path2 from "node:path";
async function realmapFromFs(pkgJsonDir) {
  pkgJsonDir ??= ".";
  const depmap = {};
  const pakmap = {};
  await treeverse.depth({
    tree: pkgJsonDir,
    async getChildren(node) {
      const pkgDependencies = await findPkgDependencies(node);
      depmap[node] = pkgDependencies.dependencies;
      pakmap[node] = pkgDependencies.pkg;
      return Object.values(pkgDependencies.dependencies);
    }
  });
  return { pakmap, depmap };
}
async function findPkgDependencies(pkgDirPath) {
  const pkg = await fs.promises.readFile(
    path2.join(pkgDirPath, "package.json"),
    { encoding: "utf8" }
  ).then((pkgJson) => JSON.parse(pkgJson)).catch(() => void 0);
  if (!pkg) {
    throw new Error("This is not package directory", {
      cause: { pkgDirPath }
    });
  }
  const dependencies = /* @__PURE__ */ new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {})
  ]);
  const resolvedDependencies = [];
  let currentDirPath = pkgDirPath;
  while (true) {
    if (await fs.promises.access(path2.join(
      currentDirPath,
      "node_modules"
    )).then(() => true).catch(() => false)) {
      const maybeResolvedDependencies = await Promise.all(
        [...dependencies].map(
          (alias) => fs.promises.realpath(
            path2.join(
              currentDirPath,
              "node_modules",
              alias
            )
          ).then((realpath) => [
            alias,
            path2.relative(".", realpath)
          ]).catch(() => null)
        )
      ).then(
        (dependencies2) => dependencies2.filter((dependency) => dependency !== null)
      );
      for (const meybeResolvedDependency of maybeResolvedDependencies) {
        if (meybeResolvedDependency !== null) {
          resolvedDependencies.push(meybeResolvedDependency);
          dependencies.delete(meybeResolvedDependency[0]);
        }
      }
    }
    if (currentDirPath === "." || currentDirPath === "/" || dependencies.size === 0) {
      if (dependencies.size !== 0) {
        console.log({
          type: "Unresolved dependencies",
          forPkgDir: pkgDirPath,
          unresolved: [...dependencies].join(", ")
        });
      }
      return {
        pkg,
        dependencies: Object.fromEntries(resolvedDependencies)
      };
    }
    currentDirPath = path2.dirname(currentDirPath);
  }
}

// src/integritymap.ts
import fs2 from "node:fs";
import { createHash } from "node:crypto";
import stream from "node:stream";
import path3 from "node:path";
import { pipableObjectFrom } from "@user3232/pipable";
function globalizeIntegritymap(integritymap, globmap) {
  return pipableObjectFrom(integritymap).filtermapKeys((key) => globmap[key]).value;
}
async function integritymapFrom(pkgsDirs, filemap, algorithm) {
  const filteredFilemap = {};
  for (const pkgDir of pkgsDirs) {
    if (filemap[pkgDir]) {
      filteredFilemap[pkgDir] = filemap[pkgDir];
    }
  }
  const intEntries = await Promise.all(
    Object.entries(filteredFilemap).map(async ([pkgPath, files]) => {
      const pkgFilesIntegrity = Object.fromEntries(
        await Promise.all(
          files.map(async (file) => [
            file,
            await fileIntegrity(path3.join(pkgPath, file), algorithm)
          ])
        )
      );
      return [
        pkgPath,
        pkgFilesIntegrity
      ];
    })
  );
  return Object.fromEntries(intEntries);
}
async function fileIntegrity(filePath, algorithm) {
  const hash = createHash(algorithm);
  const fileSource = fs2.createReadStream(filePath);
  await stream.promises.pipeline(
    fileSource,
    hash
  );
  return `${algorithm}-${hash.digest("base64url")}`;
}

// src/globmap.ts
import treeverse2 from "treeverse";
async function globmapFrom(pakmap, depmap, pkgDir) {
  const globmap = {};
  pkgDir ??= ".";
  await treeverse2.depth({
    tree: pkgDir,
    visit(node) {
      return node;
    },
    async leave(node, children) {
      const { name, version } = pakmap[node];
      if (children.length === 0) {
        const globalizedPath2 = `${name}@${version}`;
        globmap[node] = globalizedPath2;
        return globalizedPath2;
      }
      const dependencies = children.join(",");
      const dependenciesHash = await stringToSha256To10BToBase64Url(dependencies);
      const globalizedPath = `${name}@${version}:${dependenciesHash}`;
      globmap[node] = globalizedPath;
      return globalizedPath;
    },
    async getChildren(node) {
      return Object.values(depmap[node] ?? {});
    }
  });
  return globmap;
}
async function stringToSha256To10BToBase64Url(string) {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(string)
  ).then((buf) => buf.slice(0, 10));
  const btoaRes = btoa(String.fromCodePoint(...new Uint8Array(hashBuffer)));
  return [...btoaRes].map(
    (c) => c === "/" ? "_" : c === "+" ? "-" : c === "=" ? "" : c
  ).join("");
}

// src/specmap.ts
import { pipableObjectFrom as pipableObjectFrom2 } from "@user3232/pipable";
import npa from "npm-package-arg";
function globalizeSpecmap(specmap, globmap, scopemap) {
  return pipableObjectFrom2(specmap).filtermapKeys((pkgDir) => {
    const pkgDirGlob = globmap[pkgDir];
    if (pkgDirGlob !== void 0 && (scopemap.exports[pkgDirGlob] !== void 0 || scopemap.imports[pkgDirGlob] !== void 0)) {
      return pkgDirGlob;
    }
    return void 0;
  }).toSortedByKey().value;
}
function specmapFrom(pakmap, depmap, pkgJsonDir, pkgSpec) {
  const specmap = {};
  for (const [pkgDir, pkg] of Object.entries(pakmap)) {
    const allDeps = [
      ...Object.entries(pkg.dependencies ?? {}),
      ...Object.entries(pkg.peerDependencies ?? {}),
      ...Object.entries(pkg.optionalDependencies ?? {})
    ];
    for (const [alias, spec] of allDeps) {
      const aliasPath = depmap[pkgDir][alias];
      if (aliasPath) {
        const aliasPkg = pakmap[aliasPath];
        if (aliasPkg) {
          specmap[aliasPath] = specPkg(alias, spec, aliasPkg);
        }
      }
    }
  }
  if (pkgSpec !== void 0) {
    specmap[pkgJsonDir] = pkgSpec;
  } else if (pakmap[pkgJsonDir]?.spec !== void 0) {
    specmap[pkgJsonDir] = pakmap[pkgJsonDir].spec;
  } else {
  }
  return specmap;
}
function specPkg(alias, spec, pkg) {
  const resolvedSpec = npa.resolve(alias, spec);
  switch (resolvedSpec.type) {
    // file:something.tar.gz
    case "file":
    // file:something
    case "directory":
    // https://example.org/something.tgz
    case "remote": {
      return resolvedSpec.saveSpec;
    }
    // git+https://github.com/user/project.git#semver:1.2.3
    // git+file:///home/user/projects/project#semver:1.2.3
    // github:user/project.git#semver:1.2.3
    case "git": {
      const hashIndex = resolvedSpec.saveSpec.lastIndexOf("#");
      const saveSpecWithoutRange = hashIndex !== -1 ? resolvedSpec.saveSpec.slice(0, hashIndex) : resolvedSpec.saveSpec;
      return `${saveSpecWithoutRange}#semver:${pkg.version}`;
    }
    // npm:something@1.2.3
    case "version":
    // npm:something@^1.2
    case "range":
    // npm:something@latest
    case "tag": {
      return `npm:${resolvedSpec.name}@${pkg.version}`;
    }
    case "alias": {
      switch (resolvedSpec.subSpec.type) {
        case "file":
        case "directory":
        case "git":
        case "remote":
        case "alias": {
          console.log({
            type: 'Error: specPkg alias is not "npm:"',
            resolvedSpec
          });
          return "";
        }
        case "version":
        case "range":
        case "tag": {
          return `npm:${resolvedSpec.subSpec.name}@${pkg.version}`;
        }
      }
    }
  }
}

// src/importmap.ts
import path4 from "node:path";
import { Prefixes } from "@user3232/pattern";
import { pipableObjectFrom as pipableObjectFrom3 } from "@user3232/pipable";
function importmapFrom(nodemap, scopemap, integritymap, pkgJsonDir, baseUrl) {
  pkgJsonDir ??= ".";
  baseUrl ??= ".";
  const pkgJsonUrl = path4.join(baseUrl, pkgJsonDir);
  const importmapScopes = {};
  const pkgUrls = /* @__PURE__ */ new Set(
    [
      ...Object.keys(scopemap.exports),
      ...Object.keys(scopemap.imports)
    ]
  );
  for (const pkgUrl of pkgUrls) {
    const pkg = nodemap.scopes[pkgUrl];
    const scope = path4.join(baseUrl, pkgUrl);
    const pkgExports = scopemap.exports[pkgUrl];
    if (pkgExports) {
      if (!importmapScopes[scope]) {
        importmapScopes[scope] = {};
      }
      for (const [exportsSubpath, exportsSubpathFile] of Object.entries(pkgExports)) {
        const pkgImport = path4.join(pkg.name, exportsSubpath);
        if (exportsSubpathFile === null) {
          importmapScopes[scope][pkgImport] = null;
        } else {
          importmapScopes[scope][pkgImport] = path4.join(baseUrl, pkgUrl, exportsSubpathFile);
        }
      }
    }
    for (const [dependency, dependencyPkgPath] of Object.entries(pkg.dependencies ?? {})) {
      const dependencyPkgExports = scopemap.exports[dependencyPkgPath];
      for (const [exportsSubpath, file] of Object.entries(dependencyPkgExports ?? {})) {
        const pkgImport = path4.join(dependency, exportsSubpath);
        if (!importmapScopes[scope]) {
          importmapScopes[scope] = {};
        }
        if (file === null) {
          importmapScopes[scope][pkgImport] = null;
        } else {
          importmapScopes[scope][pkgImport] = path4.join(baseUrl, dependencyPkgPath, file);
        }
      }
    }
    const pkgImports = scopemap.imports[pkgUrl];
    if (pkgImports) {
      if (!importmapScopes[scope]) {
        importmapScopes[scope] = {};
      }
      const resolver = new Prefixes(Object.keys(pkg.dependencies ?? {}));
      for (const [importsSubpath, dependencyOrFile] of Object.entries(pkgImports)) {
        if (dependencyOrFile === null) {
          importmapScopes[scope][importsSubpath] = null;
        } else if (dependencyOrFile.startsWith("./")) {
          importmapScopes[scope][importsSubpath] = path4.join(baseUrl, pkgUrl, dependencyOrFile);
        } else {
          const dependency = resolver.matchBestTo(dependencyOrFile);
          if (dependency !== void 0) {
            const dependencyPath = pkg.dependencies[dependency];
            const dependencyExports = scopemap.exports[dependencyPath];
            if (dependencyExports !== void 0) {
              const dependencySubpath = `.${dependencyOrFile.slice(dependency.length)}`;
              const file = dependencyExports[dependencySubpath];
              if (file !== void 0) {
                if (file === null) {
                  importmapScopes[scope][importsSubpath] = null;
                } else {
                  importmapScopes[scope][importsSubpath] = path4.join(baseUrl, dependencyPath, file);
                }
              }
            }
          }
        }
      }
    }
  }
  const integrity = pipableObjectFrom3(integritymap).flatmap(
    (pkgDir, files) => pipableObjectFrom3(files).mapKey(
      (file) => path4.join(baseUrl, pkgDir, file)
    ).value
  ).value;
  return {
    imports: importmapScopes[pkgJsonUrl],
    scopes: importmapScopes,
    integrity
  };
}
function importmapRebase(importmap, basePath, origin) {
  origin ??= "";
  const imports = pipableObjectFrom3(importmap.imports ?? {}).map(
    (_, modulePath) => modulePath === null ? modulePath : origin + path4.join(basePath, modulePath)
  ).value;
  const scopes = pipableObjectFrom3(importmap.scopes ?? {}).mapKeyValue(
    (scope, _) => origin + path4.join(basePath, scope, "/"),
    (_, imports2) => pipableObjectFrom3(imports2).map(
      (_2, modulePath) => modulePath === null ? modulePath : origin + path4.join(basePath, modulePath)
    ).value
  ).value;
  const integrity = pipableObjectFrom3(importmap.integrity ?? {}).mapKey((modulePath, _) => origin + path4.join(basePath, modulePath)).value;
  return {
    imports,
    scopes,
    integrity
  };
}

// src/scopemap.ts
import path5 from "node:path";
import { WildcardPatterns } from "@user3232/pattern";
function scopemapFrom(env, filemap, nodemap, pkgJsonDir) {
  pkgJsonDir ??= ".";
  const exportsScopemap = {};
  for (const [location, pkg] of Object.entries(nodemap.scopes ?? {})) {
    const envResolvedExports = envResolveExports(env, pkg.type, pkg.exports);
    const resolvedExports = resolveImportsExports(envResolvedExports, filemap[location]);
    if (resolvedExports) {
      exportsScopemap[location] = resolvedExports;
    }
  }
  const importsScopemap = {};
  for (const [location, pkg] of Object.entries(nodemap.scopes ?? {})) {
    const envResolvedImports = envResolveImports(env, pkg.type, pkg.imports);
    const filesOrDependencies = [...filemap[location] ?? []];
    for (const [dependency, dependencyPath] of Object.entries(pkg.dependencies ?? {})) {
      filesOrDependencies.push(
        ...Object.keys(exportsScopemap[dependencyPath] ?? {}).map((exportsSubpath) => path5.join(dependency, exportsSubpath))
      );
    }
    const resolvedImports = resolveImportsExports(envResolvedImports, filesOrDependencies);
    if (resolvedImports) {
      importsScopemap[location] = resolvedImports;
    }
  }
  return {
    exports: exportsScopemap,
    imports: importsScopemap
  };
}
function envResolveImports(env, jsType, pkgImports) {
  if (pkgImports === void 0) {
    return void 0;
  }
  const pkgImportsSubimports = {};
  for (const [subimport, pkgImportsValue] of Object.entries(pkgImports)) {
    if (subimport.startsWith("#")) {
      const resolvedPkgImportsValue = envResolveImportsExportsValue(
        env,
        jsType,
        pkgImportsValue
      );
      if (resolvedPkgImportsValue !== void 0) {
        pkgImportsSubimports[subimport] = resolvedPkgImportsValue;
      }
    }
  }
  if (Object.keys(pkgImportsSubimports).length !== 0) {
    return pkgImportsSubimports;
  }
  return void 0;
}
function resolveImportsExports(envResolvedExports, pkgFiles) {
  if (!envResolvedExports) {
    return void 0;
  }
  pkgFiles ??= [];
  const finiteSubpaths = [];
  for (const [importPattern, filePattern] of Object.entries(envResolvedExports)) {
    finiteSubpaths.push(
      ...listResolvableImportsExportsSubpaths(importPattern, filePattern, pkgFiles)
    );
  }
  const resolver = new WildcardPatterns(Object.keys(envResolvedExports));
  const resolvedExportsList = [];
  for (const finiteSubpath of finiteSubpaths) {
    const resolvedImport = resolver.matchBestToEx(finiteSubpath);
    if (resolvedImport !== void 0) {
      resolvedExportsList.push([
        finiteSubpath,
        // path.join(pkgName, finiteSubpath), 
        substituteStarPattern(
          envResolvedExports[resolvedImport.pattern],
          resolvedImport.matched
        )
      ]);
    }
  }
  const resolvedExports = Object.fromEntries(resolvedExportsList);
  return resolvedExports;
}
function listResolvableImportsExportsSubpaths(importPattern, filePattern, pkgFiles) {
  const finiteSubpaths = [];
  const {
    starred: importStarred,
    prefix: importPrefix,
    postfix: importPostfix
  } = stringStar(importPattern);
  if (!importStarred) {
    finiteSubpaths.push(importPattern);
  } else {
    if (filePattern === null) {
    } else {
      filePattern = path5.normalize(filePattern);
      const {
        starred: fileStarred,
        prefix: filePrefix,
        postfix: filePostfix
      } = stringStar(filePattern);
      if (!fileStarred) {
      } else {
        for (let file of pkgFiles) {
          file = path5.normalize(file);
          if (file.startsWith(filePrefix) && file.endsWith(filePostfix)) {
            const fileMatch = file.slice(
              filePrefix.length,
              file.length - filePostfix.length
            );
            finiteSubpaths.push(
              `${importPrefix}${fileMatch}${importPostfix}`
            );
          }
        }
      }
    }
  }
  return finiteSubpaths;
}
function substituteStarPattern(pattern, starSubstitute) {
  if (pattern === null) {
    return pattern;
  }
  const { starred, prefix, postfix } = stringStar(pattern);
  if (!starred) {
    return pattern;
  }
  return `${prefix}${starSubstitute}${postfix}`;
}
function stringStar(string) {
  const starIndex = string.indexOf("*");
  if (starIndex === -1) {
    return {
      starred: false
    };
  }
  return {
    starred: true,
    prefix: string.slice(0, starIndex),
    postfix: string.slice(starIndex + 1)
  };
}
function envResolveExports(env, jsType, pkgExports) {
  if (pkgExports === void 0) {
    return void 0;
  } else if (pkgExports === null) {
    return { ".": null };
  } else if (typeof pkgExports === "string") {
    return { ".": pkgExports };
  } else if (Array.isArray(pkgExports)) {
    for (const pkgExportsFallback of pkgExports) {
      const envResolvedPkgExportsFallback = envResolveExports(
        env,
        jsType,
        pkgExportsFallback
      );
      if (envResolvedPkgExportsFallback !== void 0) {
        return envResolvedPkgExportsFallback;
      }
    }
    return void 0;
  } else if (typeof pkgExports === "object") {
    if (Object.keys(pkgExports).every(
      (pkgExportsSubexport) => pkgExportsSubexport.startsWith(".")
    )) {
      const pkgExportsSubexports = {};
      for (const [subexport, pkgExportsValue] of Object.entries(pkgExports)) {
        const resolvedPkgExportsValue = envResolveImportsExportsValue(
          env,
          jsType,
          pkgExportsValue
        );
        if (resolvedPkgExportsValue !== void 0) {
          pkgExportsSubexports[subexport] = resolvedPkgExportsValue;
        }
      }
      if (Object.keys(pkgExportsSubexports).length !== 0) {
        return pkgExportsSubexports;
      }
      return void 0;
    } else if (Object.keys(pkgExports).every(
      (pkgExportsSubexport) => !pkgExportsSubexport.startsWith(".")
    )) {
      const envResolvedScopedPkgExportsValue = dotRelativeFilePath2(
        envResolveImportsExportsValue(
          env,
          jsType,
          pkgExports
        )
      );
      if (envResolvedScopedPkgExportsValue !== void 0) {
        return { ".": envResolvedScopedPkgExportsValue };
      }
      return void 0;
    } else {
      console.log({
        type: "envResolveExports mixed scopes and subexports",
        pkgExports
      });
      return void 0;
    }
  } else {
    console.log({
      type: "envResolveExports bad pkgExports type",
      pkgExports
    });
    return void 0;
  }
}
function dotRelativeFilePath2(path8) {
  if (path8 === null || path8 === void 0) {
    return path8;
  } else if (path8.endsWith("/")) {
    return void 0;
  } else if (path8.startsWith("./") || path8.startsWith("../") || path8.startsWith("/")) {
    return path8;
  } else if (path8 === ".") {
    return void 0;
  } else if (path8 === "..") {
    return void 0;
  } else {
    return `./${path8}`;
  }
}
function envResolveImportsExportsValue(env, jsType, ie) {
  if (ie === void 0) {
    return void 0;
  } else if (ie === null) {
    return null;
  } else if (typeof ie === "string") {
    return ie;
  } else if (Array.isArray(ie)) {
    for (const ieFallback of ie) {
      const resolvedIe = envResolveImportsExportsValue(env, jsType, ieFallback);
      if (resolvedIe !== void 0) {
        return resolvedIe;
      }
    }
    return void 0;
  } else if (typeof ie === "object") {
    for (const [scope, scopeIe] of Object.entries(ie)) {
      if (scope === "default" || env.includes(scope)) {
        const resolvedScopeIe = envResolveImportsExportsValue(env, jsType, scopeIe);
        if (resolvedScopeIe !== void 0) {
          return resolvedScopeIe;
        }
      }
    }
    return void 0;
  } else {
    console.log({
      type: "envResolveImportValue bad ie type",
      ie
    });
    return void 0;
  }
}

// src/build.ts
async function buildImprtmap(env, pkgJsonDir, baseUrl, pkgSpec) {
  const { pakmap, depmap } = await realmapFromFs(pkgJsonDir);
  const specmap = specmapFrom(
    pakmap,
    depmap,
    pkgJsonDir,
    pkgSpec
  );
  const nodemapLocal = nodemapLocalFrom(pakmap, depmap, pkgJsonDir);
  const filemapLocal = await filemapFrom(pakmap, pkgJsonDir);
  const scopemapLocal = scopemapFrom(
    env,
    filemapLocal,
    nodemapLocal,
    pkgJsonDir
  );
  const integritymapLocal = await integritymapFrom(
    [
      ...Object.keys(scopemapLocal.exports),
      ...Object.keys(scopemapLocal.imports)
    ],
    filemapLocal,
    "sha256"
  );
  const importmapLocal = importmapFrom(
    nodemapLocal,
    scopemapLocal,
    integritymapLocal,
    pkgJsonDir,
    baseUrl
  );
  const globmap = await globmapFrom(pakmap, depmap, pkgJsonDir);
  const pkgJsonGlobDir = globmap[pkgJsonDir];
  const nodemapGlobal = nodemapGlobalFrom(nodemapLocal, globmap);
  const filemapGlobal = filemapGlobalFrom(filemapLocal, globmap);
  const scopemapGlobal = scopemapFrom(
    env,
    filemapGlobal,
    nodemapGlobal,
    pkgJsonGlobDir
  );
  const integritymapGlobal = globalizeIntegritymap(
    integritymapLocal,
    globmap
  );
  const importmapGlobal = importmapFrom(
    nodemapGlobal,
    scopemapGlobal,
    integritymapGlobal,
    pkgJsonGlobDir,
    baseUrl
  );
  const specmapGlobal = globalizeSpecmap(
    specmap,
    globmap,
    scopemapGlobal
  );
  return {
    local: importmapLocal,
    global: importmapGlobal,
    spec: specmapGlobal,
    pkgJsonGlobDir
  };
}

// src/cli.ts
import { glob as glob2 } from "glob";
import fs3 from "node:fs";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { parse } from "node-html-parser";
async function cli(argv) {
  const commandArgs = commandLineArgs(
    [
      {
        name: "command",
        defaultOption: true
      }
    ],
    {
      stopAtFirstUnknown: true,
      argv
    }
  );
  switch (commandArgs.command) {
    case "help": {
      return console.log(helpImportmapCli);
    }
    case "build": {
      const { env } = commandLineArgs(
        [
          {
            name: "env",
            defaultOption: true,
            type: String,
            multiple: true
          }
        ],
        {
          argv: commandArgs._unknown
        }
      );
      return await cliImportmap(".", env);
    }
    case "rebase": {
      const args = commandLineArgs(
        [
          {
            name: "base-path",
            defaultOption: true,
            type: String
          },
          {
            name: "origin",
            type: String
          },
          {
            name: "local",
            type: Boolean,
            defaultValue: false
          },
          {
            name: "no-global",
            type: Boolean,
            defaultValue: false
          }
        ],
        {
          argv: commandArgs._unknown
        }
      );
      return await cliRebase(
        args["base-path"] ?? "/",
        args.origin,
        !args["no-global"],
        args.local,
        "."
      );
    }
    case "inject": {
      const injectArgs = commandLineArgs(
        [
          {
            name: "importmap",
            defaultOption: true,
            type: String
          }
        ],
        {
          argv: commandArgs._unknown,
          stopAtFirstUnknown: true
        }
      );
      if (!injectArgs.importmap) {
        console.log("importmap inject: importfile file must be provided!");
        return;
      }
      const injectHtmlsArgs = commandLineArgs(
        [
          {
            name: "html",
            defaultOption: true,
            multiple: true,
            type: String
          }
        ],
        {
          argv: injectArgs._unknown
        }
      );
      if (!injectHtmlsArgs.html) {
        console.log("importmap inject: html(s) file(s) must be provided!");
        return;
      }
      return await cliImportmapInjectHtml(
        injectArgs.importmap,
        injectHtmlsArgs.html
      );
    }
    default: {
      return console.log(helpImportmapCli);
    }
  }
}
var helpImportmapCli = commandLineUsage([
  {
    header: `importmap`,
    content: `Provides operations for generating importmaps from "package.json" and "node_modules".`
  },
  {
    header: `Synopsis`,
    content: [
      `$ importmap {bold help}`,
      `$ importmap {bold build} [[{bold --env}] {underline scope}]*`,
      `$ importmap {bold rebase} [[{bold --base-path}] {underline path}] [{bold --origin} {underline origin}] [{bold --no-global}] [{bold --local}]`,
      `$ importmap {bold inject} [{bold --importmap}] {underline path} [[{bold --html}] {underline path}]+`
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
      `$ importmap inject [import].local.importmap.json *.html`
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
        summary: `Analizes current directory "package.json" and "node_modules" and generates importmaps.`
      },
      {
        command: `build`,
        arg: `[[{bold --env}] {underline env}]*`,
        summary: `Enviroment features. If none provided "import" is used.`
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
      }
    ]
  }
]);
var ImportmapExt = {
  spec: ".importmap.spec.json",
  local: ".importmap.local.json",
  global: ".importmap.global.json",
  bare: "."
};
async function cliImportmap(cwd, env) {
  cwd ??= ".";
  env ??= ["import"];
  const pkgJsonDir = cwd;
  const baseUrl = cwd;
  const { local, global, spec, pkgJsonGlobDir } = await buildImprtmap(
    env,
    pkgJsonDir,
    baseUrl
  );
  const envString = env.toSorted().join(",");
  const importmapName = pkgJsonGlobDir.replace("/", "__");
  await fs3.promises.writeFile(
    `${ImportmapExt.bare}[${envString}]${ImportmapExt.local}`,
    JSON.stringify(local, void 0, 2)
  );
  console.log(`importmap build: Created bare local importmap at: ${ImportmapExt.bare}[${envString}]${ImportmapExt.local}`);
  await fs3.promises.writeFile(
    `${ImportmapExt.bare}[${envString}]${ImportmapExt.global}`,
    JSON.stringify(global, void 0, 2)
  );
  console.log(`importmap build: Created bare global importmap at: ${ImportmapExt.bare}[${envString}]${ImportmapExt.global}`);
  await fs3.promises.writeFile(
    `${importmapName}.[${envString}]${ImportmapExt.spec}`,
    JSON.stringify(spec, void 0, 2)
  );
  console.log(`importmap build: Created global importmap spec at: ${importmapName}.[${envString}]${ImportmapExt.spec}`);
  const relocal = importmapRebase(local, "/");
  await fs3.promises.writeFile(
    `[${envString}]${ImportmapExt.local}`,
    JSON.stringify(relocal, void 0, 2)
  );
  console.log(`importmap build: Created local importmap rebased to "/" at: [${envString}]${ImportmapExt.local}`);
  const reglobal = importmapRebase(global, "/");
  await fs3.promises.writeFile(
    `[${envString}]${ImportmapExt.global}`,
    JSON.stringify(reglobal, void 0, 2)
  );
  console.log(`importmap build: Created global importmap rebased to "/" at: [${envString}]${ImportmapExt.global}`);
}
async function cliRebase(baseUrl, origin, global, local, cwd) {
  cwd ??= ".";
  const globPatterns = [];
  if (global) {
    globPatterns.push(`${ImportmapExt.bare}*${ImportmapExt.global}`);
  }
  if (local) {
    globPatterns.push(`${ImportmapExt.bare}*${ImportmapExt.local}`);
  }
  const importmapsFiles = await glob2(globPatterns, { cwd });
  if (importmapsFiles.length === 0) {
    console.log("importmap rebase: no importmap files. Nothing to do.");
    return;
  }
  for (const importmapFile of importmapsFiles) {
    console.log(`importmap rebase: rebasing from ${importmapFile}`);
  }
  const remaps = importmapsFiles.map(async (importmapFile) => {
    const importmap = JSON.parse(await fs3.promises.readFile(
      importmapFile,
      { encoding: "utf8" }
    ));
    const importmapRe = importmapRebase(importmap, baseUrl, origin);
    await fs3.promises.writeFile(
      importmapFile.slice(ImportmapExt.bare.length),
      JSON.stringify(importmapRe, void 0, 2),
      "utf8"
    );
  }).map(
    (remap) => remap.catch(
      (err) => new Error("importmap rebase: rebasing problem!", { cause: err })
    )
  );
  const remappeds = await Promise.all(remaps);
  const remappedsErrors = remappeds.filter((remapped) => remapped instanceof Error);
  if (remappedsErrors.length !== 0) {
    console.log("importmap rebase: rebasing problems!");
    remappedsErrors.forEach((fetchError) => console.log(fetchError));
  }
  console.log("importmap rebase: done.");
}
async function cliImportmapInjectHtml(importmapFile, htmlsFiles) {
  if (htmlsFiles.length === 0) {
    console.log("importmap inject: Nothing to do, no html's.");
    return;
  }
  const importmap = await fs3.promises.readFile(
    importmapFile,
    { encoding: "utf8" }
  ).catch(
    (err) => err instanceof Error ? err : new Error("Reading importmap file error", {
      cause: {
        importmapFile,
        reason: err
      }
    })
  );
  if (importmap instanceof Error) {
    console.log("importmap inject: Loading importmap failed.");
    console.error(importmap);
    return;
  }
  const htmlsOperations = htmlsFiles.map(async (htmlFile) => {
    const html = await fs3.promises.readFile(
      htmlFile,
      { encoding: "utf8" }
    );
    const newHtml = importmapInjectHtml(importmap, html);
    if (newHtml) {
      await fs3.promises.writeFile(
        htmlFile,
        newHtml,
        { encoding: "utf8" }
      );
      console.log(`importmap inject: ${htmlFile} done!`);
    } else {
      console.log(`importmap inject: ${htmlFile} nothing to do!`);
    }
  }).map((operation) => {
    operation.catch((err) => {
      console.log("importmap inject: file operation error.");
      console.error(err);
    });
  });
  await Promise.all(htmlsOperations);
  function importmapInjectHtml(importmap2, html) {
    const root = parse(html);
    const importmapNode = root.querySelector('script[type="importmap"]');
    if (!importmapNode) {
      return null;
    }
    importmapNode.set_content("\n" + importmap2 + "\n");
    return root.toString();
  }
}

// src/node-resolve/node-resolve.ts
import path7 from "node:path";
import fs5 from "node:fs";

// src/node-resolve/pkg-runtime.ts
import path6 from "node:path";
import fs4 from "node:fs";
async function findFileImportPkg(moduleFilePath, moduleFileImportAlias) {
  let currentDirPath = path6.dirname(moduleFilePath);
  while (true) {
    const bundledPkgPath = path6.join(
      currentDirPath,
      "node_modules",
      moduleFileImportAlias
    );
    const bundledPkg = await fs4.promises.readFile(
      path6.join(bundledPkgPath, "package.json"),
      { encoding: "utf8" }
    ).then((json) => JSON.parse(json)).catch(() => null);
    if (bundledPkg) {
      return {
        pkg: bundledPkg,
        pkgPath: bundledPkgPath
      };
    }
    const parentPkgPath = path6.join(currentDirPath, "package.json");
    const parentPkg = await fs4.promises.readFile(
      parentPkgPath,
      { encoding: "utf8" }
    ).then((json) => JSON.parse(json)).catch(() => null);
    if (parentPkg && parentPkg.name === moduleFileImportAlias) {
      return { pkg: parentPkg, pkgPath: currentDirPath };
    }
    if (currentDirPath === "." || currentDirPath === "/") {
      return {
        pkg: null,
        pkgPath: null
      };
    }
    currentDirPath = path6.dirname(currentDirPath);
  }
}
async function findFilePkgJson(modulePath) {
  let dirPath = path6.dirname(modulePath);
  while (true) {
    const pkgJson = await fs4.promises.readFile(
      path6.join(dirPath, "package.json"),
      { encoding: "utf8" }
    ).then((pkgJson2) => JSON.parse(pkgJson2)).catch(() => null);
    if (pkgJson) {
      return {
        pkgDir: dirPath,
        pkg: pkgJson
      };
    }
    if (dirPath === "." || dirPath === "/") {
      return {
        pkgDir: null,
        pkg: null
      };
    }
    dirPath = path6.dirname(dirPath);
  }
}

// src/node-resolve/resolve-imports.ts
import { WildcardPatterns as WildcardPatterns2 } from "@user3232/pattern";

// src/node-resolve/pattern.ts
function replacePatternWith(pattern, starReplacer) {
  const starIndex = pattern.indexOf("*");
  if (starIndex === -1) {
    return pattern;
  }
  const prefix = pattern.slice(0, starIndex);
  const postfix = pattern.slice(starIndex + 1);
  return prefix + starReplacer + postfix;
}

// src/node-resolve/resolve-imports.ts
function resolvePkgImportsImport(importHash, pkg, env) {
  const importsWildcards = new WildcardPatterns2(
    Object.keys(pkg.imports ?? {})
  );
  const match = importsWildcards.matchBestToEx(importHash);
  if (!match) {
    return void 0;
  }
  const { matched, pattern } = match;
  const pkgImport = pkg.imports?.[pattern];
  const resolvedPattern = resolvePkgImportsValue(env, pkgImport);
  if (resolvedPattern === null || resolvedPattern === void 0) {
    return resolvedPattern;
  }
  const resolved = replacePatternWith(resolvedPattern, matched);
  return resolved;
}
function resolvePkgImportsValue(env, pkgImport) {
  if (pkgImport === null) {
    return null;
  } else if (typeof pkgImport === "string") {
    return pkgImport;
  } else if (Array.isArray(pkgImport)) {
    for (const fallbackPkgImport of pkgImport) {
      const resolved = resolvePkgImportsValue(
        env,
        fallbackPkgImport
      );
      if (resolved !== void 0) {
        return resolved;
      }
    }
    return void 0;
  } else if (typeof pkgImport === "object") {
    for (const [scope, scopePkgImport] of Object.entries(pkgImport)) {
      if (scope === "default" || env.includes(scope)) {
        const resolved = resolvePkgImportsValue(
          env,
          scopePkgImport
        );
        if (resolved !== void 0) {
          return resolved;
        }
      }
    }
    return void 0;
  } else {
    return void 0;
  }
}

// src/node-resolve/import-text.ts
function importTextToAliasAndPath(moduleImport) {
  let sepIndex = moduleImport.indexOf("/");
  if (moduleImport.startsWith("@")) {
    sepIndex = moduleImport.indexOf("/", sepIndex + 1);
  }
  if (sepIndex === -1) {
    return {
      alias: moduleImport,
      path: "."
    };
  }
  const resource = moduleImport.slice(0, sepIndex);
  const subresource = moduleImport.slice(sepIndex + 1);
  return {
    alias: resource,
    path: `./${subresource}`
  };
}

// src/node-resolve/resolve-exports.ts
import { WildcardPatterns as WildcardPatterns3 } from "@user3232/pattern";
function resolvePkgExport(path8, pkg, env) {
  if (pkg.exports !== void 0) {
    return resolvePkgExportsExport(
      path8,
      pkg.exports,
      env ?? []
    );
  } else if (typeof pkg.main === "string" && pkg.main.startsWith("./")) {
    return pkg.main;
  } else {
    return void 0;
  }
}
function resolvePkgExportsExport(exportPath, pkgExports, env) {
  if (pkgExports === void 0) {
    return void 0;
  } else if (pkgExports === null) {
    if (exportPath === ".") {
      return null;
    }
    return void 0;
  } else if (Array.isArray(pkgExports)) {
    for (const fallbackPkgExports of pkgExports) {
      const resolved = resolvePkgExportsExport(
        exportPath,
        fallbackPkgExports,
        env
      );
      if (resolved !== void 0) {
        return resolved;
      }
    }
    return void 0;
  } else if (typeof pkgExports === "object") {
    if (Object.keys(pkgExports).every((pkgExport) => pkgExport.startsWith("."))) {
      const exportsWildcards = new WildcardPatterns3(
        Object.keys(pkgExports)
      );
      const match = exportsWildcards.matchBestToEx(exportPath);
      if (!match) {
        return void 0;
      }
      const { matched, pattern } = match;
      const resolvedPattern = resolvePkgExportsValue(
        env,
        pkgExports[pattern]
      );
      if (resolvedPattern === null || resolvedPattern === void 0) {
        return resolvedPattern;
      }
      const resolved = replacePatternWith(resolvedPattern, matched);
      return resolved;
    } else {
      if (exportPath !== ".") {
        return void 0;
      }
      const resolvedPattern = resolvePkgExportsValue(
        env,
        pkgExports["."]
      );
      return resolvedPattern;
    }
  } else {
    return void 0;
  }
}
function resolvePkgExportsValue(env, pkgExport) {
  if (pkgExport === null) {
    return null;
  } else if (typeof pkgExport === "string") {
    return pkgExport;
  } else if (Array.isArray(pkgExport)) {
    for (const fallbackPkgImport of pkgExport) {
      const resolved = resolvePkgExportsValue(
        env,
        fallbackPkgImport
      );
      if (resolved !== void 0) {
        return resolved;
      }
    }
    return void 0;
  } else if (typeof pkgExport === "object") {
    for (const [scope, scopePkgExport] of Object.entries(pkgExport)) {
      if (scope === "default" || env.includes(scope)) {
        const resolved = resolvePkgExportsValue(
          env,
          scopePkgExport
        );
        if (resolved !== void 0) {
          return resolved;
        }
      }
    }
    return void 0;
  } else {
    return void 0;
  }
}

// src/node-resolve/node-resolve.ts
async function resolveModuleImport({
  moduleFilePath,
  env,
  moduleFileImportText
}) {
  const moduleFileRealPath = await fs5.promises.realpath(
    moduleFilePath
  );
  if (moduleFileImportText.startsWith("./") || moduleFileImportText.startsWith("../") || moduleFileImportText.startsWith("/")) {
    const importAbsPath = path7.join(
      path7.dirname(moduleFileRealPath),
      moduleFileImportText
    );
    return path7.relative(
      ".",
      // path.dirname(moduleFilePath),
      importAbsPath
    );
  }
  if (moduleFileImportText.startsWith("#")) {
    const { pkg } = await findFilePkgJson(moduleFileRealPath);
    if (!pkg) {
      throw new Error('For import("#...") package.json is mandatory.', {
        cause: { moduleFilePath, moduleFileRealPath }
      });
    }
    const resolved = resolvePkgImportsImport(
      moduleFileImportText,
      pkg,
      env ?? []
    );
    if (resolved === null || resolved === void 0) {
      return resolved;
    }
    if (resolved.startsWith("./")) {
      const importAbsPath = path7.join(
        path7.dirname(moduleFileRealPath),
        moduleFileImportText
      );
      return path7.relative(
        ".",
        // path.dirname(moduleFilePath), 
        importAbsPath
      );
    }
    const {
      alias: dependencyAlias,
      path: dependencySubPath
    } = importTextToAliasAndPath(resolved);
    const {
      pkg: dependencyPkg,
      pkgPath: dependencyPkgPath
    } = await findFileImportPkg(
      moduleFileRealPath,
      dependencyAlias
    );
    if (!dependencyPkg) {
      return void 0;
    }
    const resolvedDependencySubPath = resolvePkgExport(
      dependencySubPath,
      dependencyPkg,
      env ?? []
    );
    if (resolvedDependencySubPath === void 0 || resolvedDependencySubPath === null) {
      return resolvedDependencySubPath;
    }
    return path7.relative(
      ".",
      // path.dirname(moduleFilePath),
      path7.join(dependencyPkgPath, resolvedDependencySubPath)
    );
  } else {
    const {
      alias: moduleImportAlias,
      path: moduleImportPath
    } = importTextToAliasAndPath(moduleFileImportText);
    const { pkg, pkgPath } = await findFileImportPkg(
      moduleFileRealPath,
      moduleImportAlias
    );
    if (!pkg) {
      return void 0;
    }
    const resolved = resolvePkgExport(
      moduleImportPath,
      pkg,
      env ?? []
    );
    if (resolved === void 0 || resolved === null) {
      return resolved;
    }
    return path7.relative(
      ".",
      // path.dirname(moduleFilePath),
      path7.join(pkgPath, resolved)
    );
  }
}
export {
  ImportmapExt,
  buildImprtmap,
  cli,
  cliImportmap,
  cliImportmapInjectHtml,
  cliRebase,
  fileIntegrity,
  filemapFrom,
  filemapGlobalFrom,
  globalizeIntegritymap,
  globalizeSpecmap,
  globmapFrom,
  importmapFrom,
  importmapRebase,
  integritymapFrom,
  nodemapGlobalFrom,
  nodemapLocalFrom,
  realmapFromFs,
  resolveModuleImport,
  scopemapFrom,
  specPkg,
  specmapFrom
};
