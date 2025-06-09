export default {
    name: "points",
    description: "Muestra tus puntos actuales.",
    run: async ({ message, args, userService }) => {
        try {
            const username = message.author.username;
            const nickname = await userService.getNicknameBySocialId('discord', username);

            console.log(`Looking up Points for user: ${username} with nickname: ${nickname}`);

            if (!nickname) {
                return message.reply(
                    `❌ You are not registered. Use the form to link your Discord account:\n` +
                    `🔗https://forms.gle/c7prmGpDEJpqipAa6`
                );
            }

            const points = await userService.getPoints(nickname);

            return message.reply(
                `🎉 Hello **${nickname}**!\n` +
                `🔹 You currently have **${points}** Points.\n\n` +
                `🔹 Earn more Points by watching streams, participating in chat, reacting, completing challenges, and much more!\n` +
                `🔹 Use \`!level\` to see your level.\n\n` +
                `🚀 Keep participating and climb the rankings!`
            );
        } catch (error) {
            console.error('Error en el comando !points:', error.message);
            return message.reply('❌ Ocurrió un error al consultar tus puntos. Intenta nuevamente o contacta al admin.');
        }
    }
};