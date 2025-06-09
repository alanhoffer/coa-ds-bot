export default {
    name: "addsocial",
    description: "Adds a social media to a nickname.",
    run: async ({ message, args, userService }) => {
        const argsSocial = message.content.trim().split(/\s+/).slice(1);

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (argsSocial.length < 3) {
            return message.reply('❌ Correct usage: `!addsocial <nickname> <twitch|youtube> <socialId>`');
        }

        const nickname = argsSocial.slice(0, -2).join(' ');
        const socialType = argsSocial[argsSocial.length - 2];
        const socialId = argsSocial[argsSocial.length - 1];

        try {
            await userService.addSocialToNickname(nickname, socialType, socialId);
            message.reply(`✅ Social media **${socialType}** successfully added for nickname **${nickname}**.`);
        } catch (error) {
            message.reply(`❌ Error: ${error.message}`);
        }
    }
};