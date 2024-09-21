import { Realmap } from "./types-realmap.js"


/**
 * Configuration of Realmap Manager.
 */
export type RealmapManager = {
    /**
     * Real packages directory.
     */
    "pkg-real-dir":    './pkg-real',
    /**
     * Virtual packages directory.
     */
    "pkg-virtual-dir": './pkg-virtual',
    /**
     * Configs directory.
     */
    "rm-config-file":  './rm.config.json',
    /**
     * {@link Realmap}'s directory.
     */
    "realmap-dir": '.',
    /**
     * Files with this extension will be used as {@link Realmap}.
     */
    "realmap-extension": '.realmap.json',


}