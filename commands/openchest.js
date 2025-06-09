import { CHEST_REWARDS, CHEST_PRICE } from '../config/config.js';

export default {
    name: "openchest",
    description: "Opens a chest and gives a random reward.",
    run: async ({ message, args, userService }) => {
        const username = message.author.username;
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en el form antes de abrir cofres.');
            return;
        }

        try {
            const points = await userService.getPoints(nickname);
            if (points < CHEST_PRICE) {
                message.reply(`❌ Necesitas al menos ${CHEST_PRICE} Points para abrir un cofre.`);
                return;
            }

            // Resta Points por abrir el cofre
            await userService.addPoints(nickname, -CHEST_PRICE);

            // Selecciona una recompensa aleatoria basada en probabilidades
            let randomValue = Math.random() * 100;
            let reward = null;
            for (const item of CHEST_REWARDS) {
                if (randomValue < item.probability) {
                    reward = item;
                    break;
                }
                randomValue -= item.probability;
            }

            if (!reward) {
                message.reply('❌ Ocurrió un error al abrir el cofre. Inténtalo de nuevo.');
                return;
            }

            if (reward.name === 'Adventurer level') {
                // Da el primer nivel directamente (por ejemplo, fija el nivel 1 si es 0)
                // Podrías hacer algo como:
                await userService.addLevelByNickname(nickname);
                message.reply(`🎉 ¡Abriste un cofre misterioso y recibiste el primer nivel de aventurero!`);
                return;
            }

            // Recompensa de EXP
            const leveledUp = await userService.addPoints(nickname, reward.reward);

            let response = `🎉 ¡Abriste un cofre y ganaste **${reward.reward} Puntos**!`;
            if (leveledUp) {
                response += ` 🔼 ¡Subiste de nivel de aventurero!`;
            }

            message.reply(response);

        } catch (error) {
            console.error(error);
            message.reply('❌ Ocurrió un error al abrir el cofre. Inténtalo de nuevo más tarde.');
        }
    }
};