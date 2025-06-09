import { generateTopImage } from '../utils/generateTopImage.js';

export default {
    name: "ranking",
    description: "Shows the top 5 users with the most Points.",
    run: async ({ message, args, userService }) => {
        try {
            const topUsers = await userService.getTopUsers();
            if (topUsers.length === 0) {
                message.reply('❌ No users with Points were found.');
                return;
            }

            const imagePath = await generateTopImage(topUsers);

            await message.reply({
                content: `🏆 **Top 5 users with the most Level & Points**`,
                files: [imagePath]
            });

        } catch (err) {
            console.error(err);
            message.reply('❌ An error occurred while generating the ranking.');
        }
    }
};