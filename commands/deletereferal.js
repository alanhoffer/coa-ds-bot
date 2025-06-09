import fs from 'fs/promises';
import { CLAIM_FILE } from '../config/config.js';

export default {
    name: "deletereferal",
    description: "Deletes a referral code.",
    run: async ({ message, args, userService }) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const codeToDelete = args[0];
        if (!codeToDelete) {
            return message.reply('❌ Usage: !deletereferal <codigo>');
        }

        // Leer datos
        let streamers = {};
        try {
            const data = await fs.readFile(CLAIM_FILE, 'utf8');
            streamers = JSON.parse(data);
        } catch (err) {
            console.error('❌ Error reading referral data:', err);
            return message.reply('❌ Failed to read referral data.');
        }

        // Verificar si el código existe
        if (!streamers[codeToDelete]) {
            return message.reply(`❌ The referral code "${codeToDelete}" does not exist.`);
        }

        // Eliminar el código
        delete streamers[codeToDelete];

        try {
            await fs.writeFile(CLAIM_FILE, JSON.stringify(streamers, null, 2));
            message.reply(`✅ Referral code "${codeToDelete}" deleted successfully.`);
        } catch (err) {
            console.error('❌ Error saving referral data:', err);
            message.reply('❌ Failed to save referral data after deletion.');
        }
    }
};