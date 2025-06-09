import { capitalize } from '../helpers/Capitalize.js';

export default {
    name: "updatesupporter",
    description: "Updates the supporter tier for a user.",
    run: async ({ message, args, userService }) => {
        if (!message.member || !message.member.permissions.has('Administrator')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const [nickname, socialType, tierArg] = args;

        if (!nickname || !socialType || !tierArg) {
            return message.reply('❌ Usage: !updatesupporter <nickname> <patreon|boosty> <tier>');
        }

        const tier = parseInt(tierArg, 10);
        if (isNaN(tier) || tier < 0) {
            return message.reply('❌ Tier must be a positive integer (0 or higher).');
        }

        const validSocials = ['patreon', 'boosty'];
        if (!validSocials.includes(socialType.toLowerCase())) {
            return message.reply('❌ Invalid social type. Use "patreon" or "boosty".');
        }

        try {
            const success = await userService.updateSupporterTier(nickname, socialType, tier);
            if (success) {
                return message.reply(`✅ Successfully updated ${capitalize(socialType)} tier for **${nickname}** to **${tier}**.`);
            } else {
                return message.reply('❌ Failed to update supporter tier. Please check the nickname.');
            }
        } catch (error) {
            console.error('❌ Error updating supporter tier:', error);
            return message.reply('❌ An error occurred while updating the supporter tier.');
        }
    }
};