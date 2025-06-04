import fs from 'fs/promises';
const FILE_PATH = './data/rolepickers.json';

export async function saveRolePicker(messageId, roles) {
    let data = {};
    try {
        const file = await fs.readFile(FILE_PATH, 'utf-8');
        data = JSON.parse(file);
    } catch {
        // Si no existe, lo dejamos vacío
    }

    data[messageId] = roles;
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
}

export async function getRolePickers() {
    try {
        const file = await fs.readFile(FILE_PATH, 'utf-8');
        return JSON.parse(file);
    } catch {
        return {};
    }
}
