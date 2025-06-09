import { generateUserBanner } from '../utils/generateTopImage.js';

export default {
    name: "level",
    description: "Shows the user's level banner.",
    run: async ({ message, args, userService }) => {
        const username = message.author.username;
        const discordAvatarURL = message.author.displayAvatarURL({ format: 'png', size: 128 });
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply(`❌ Please register in the form before viewing your stats.
                🔗https://forms.gle/c7prmGpDEJpqipAa6`);
            return;
        }
        try {
            const userStats = await userService.getUserStatsByNickname(nickname);
            if (!userStats) {
                message.reply('❌ No stats were found for your user.');
                return;
            }

            // Add Discord avatar to userStats for the banner
            userStats.avatarPath = discordAvatarURL;
            console.log(`Generating banner for user: userStats = ${JSON.stringify(userStats)}`);
            const imagePath = await generateUserBanner(userStats);
            await message.reply({
                content: ``,
                files: [imagePath]
            });
        } catch (error) {
            console.error(error);
            message.reply('❌ An error occurred while retrieving your stats. Please try again later.');
        }
    }
};