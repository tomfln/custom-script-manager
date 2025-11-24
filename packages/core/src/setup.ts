import { copyFile, exists } from "fs/promises";
import { join, resolve } from "path";
import { log } from "./logger";

async function setup() {
    const rootDir = resolve(import.meta.dir, '..', '..', '..');
    const envPath = join(rootDir, '.env');
    const envExamplePath = join(rootDir, '.env.example');

    if (!await exists(envPath)) {
        if (await exists(envExamplePath)) {
            log.info("Creating .env from .env.example...");
            await copyFile(envExamplePath, envPath);
            log.success(".env created. Please edit it with your configuration.");
        } else {
            log.warn(".env.example not found. Skipping .env creation.");
        }
    } else {
        log.info(".env already exists.");
    }
}

setup().catch(console.error);
