import fs from 'fs/promises';
import { CLAIM_FILE } from '../config/config.js';

export default {
    name: "addreferal",
    description: "Adds a referral code.",
    run: async ({ message, args, userService }) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (args.length < 4) {
            return message.reply('Uso: !addreferal <codigo> <userPoints> <streamerPoints> <streamerDiscordId>');
        }

        const [codigo, userPointsStr, streamerPointsStr, streamerDiscordId] = args;

        // Leer el JSON actual
        let streamers = {};
        try {
            const data = await fs.readFile(CLAIM_FILE, 'utf8');
            streamers = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('Error leyendo archivo referals:', err);
                return message.reply('Error al leer los datos de referals.');
            }
        }

        if (streamers[codigo]) {
            return message.reply(`El código ${codigo} ya existe.`);
        }

        const userPoints = parseInt(userPointsStr, 10);
        const streamerPoints = parseInt(streamerPointsStr, 10);

        if (isNaN(userPoints) || isNaN(streamerPoints)) {
            return message.reply('Los puntos deben ser números enteros.');
        }

        streamers[codigo] = {
            claimedBy: [],
            userPoints,
            streamerPoints,
            streamerId: streamerDiscordId
        };

        try {
            await fs.writeFile(CLAIM_FILE, JSON.stringify(streamers, null, 2));
        } catch (err) {
            console.error('Error guardando archivo referals:', err);
            return message.reply('Error al guardar los datos de referals.');
        }

        // Crear el rol Guild <codigo> si no existe
        try {
            let guildRole = message.guild.roles.cache.find(r => r.name === `Guild ${codigo}`);
            if (!guildRole) {
                // Función para generar color random en hex
                const getRandomColor = () =>
                    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

            guildRole = await message.guild.roles.create({
                name: `Guild ${codigo}`,
                color: getRandomColor(),
                reason: `Rol creado automáticamente para el referral ${codigo}`
            });
            console.log(`Rol creado: ${guildRole.name} (${guildRole.id})`);
        } else {
            console.log(`El rol ${rolRequerido} ya existe`);
        }
    } catch (error) {
        console.error('Error creando el rol Guild:', error);
        message.reply('⚠️ No pude crear el rol automáticamente. ¿Tengo permisos?');
    }

    message.reply(`Referal '${codigo}' agregado: userPoints=${userPoints}, streamerPoints=${streamerPoints}, streamerDiscordId=${streamerDiscordId}`);
}
};