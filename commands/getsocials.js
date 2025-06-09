import { capitalize } from '../helpers/Capitalize.js';

export default {
    name: "getsocials",
    description: "Gets the social media for a nickname.",
    run: async ({ message, args, userService }) => {
        const argsSocial = message.content.trim().split(/\s+/).slice(1); // quitar el comando

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (argsSocial.length < 1) {
            return message.reply('❌ Usage: `!getsocials <nickname>`');
        }
        const nickname = argsSocial[0];
        try {
            const socials = await userService.getSocialsByNickname(nickname);
            if (!socials || Object.keys(socials).length === 0) {
                return message.reply(`❌ No social media found for nickname **${nickname}**.`);
            }
            let response = `**Social media for ${nickname}:**\n`;
            for (const [type, id] of Object.entries(socials)) {
                response += `- **${capitalize(type)}**: ${id}\n`;
            }
            message.reply(response);
        } catch (error) {

            console.error('❌ Error retrieving socials:', error);
            message.reply('❌ An error occurred while retrieving the social media. Please try again later.');
        }
    }
};