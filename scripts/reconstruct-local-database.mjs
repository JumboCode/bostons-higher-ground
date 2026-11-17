import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// New local directories only; never reads connection strings or environment files.
export async function reconstructLocalDatabase(directory, modulePath) {
    if (!directory || directory.includes("://")) throw new Error("Supply a new local database directory.");
    if (!modulePath) throw new Error("Set PGLITE_MODULE to an installed PGlite dist/index.js path.");
    const { PGlite } = await import(pathToFileURL(path.resolve(modulePath)).href);
    const destination = path.resolve(directory);
    await mkdir(destination); // Refuse existing directories.
    const db = new PGlite(destination);
    try {
        const schema = await readFile(new URL("./lib/reconstructed-schema.sql", import.meta.url), "utf8");
        await db.exec(`BEGIN;\n${schema}\nCOMMIT;`);
        const { rows } = await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
        return { directory: destination, tables: rows.map(row => row.tablename), productionDataRecovered: false };
    } finally { await db.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    try { console.log(JSON.stringify(await reconstructLocalDatabase(process.argv[2], process.env.PGLITE_MODULE), null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
}
