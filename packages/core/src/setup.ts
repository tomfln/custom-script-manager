import { copyFile, exists } from "fs/promises";
import { join, resolve } from "path";

async function setup() {
    const rootDir = resolve(import.meta.dir, '..', '..', '..');
    const envPath = join(rootDir, '.env');
    const envExamplePath = join(rootDir, '.env.example');

    if (!await exists(envPath)) {
        if (await exists(envExamplePath)) {
            console.log("Creating .env from .env.example...");
            await copyFile(envExamplePath, envPath);
            console.log(".env created. Please edit it with your configuration.");
        } else {
            console.warn(".env.example not found. Skipping .env creation.");
        }
    } else {
        console.log(".env already exists.");
    }
}

setup().catch(console.error);
