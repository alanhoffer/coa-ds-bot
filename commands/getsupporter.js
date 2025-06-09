import { capitalize } from '../helpers/Capitalize.js';

export default {
    name: "getsupporter",
    description: "Obtains supporter status for a user.",
    run: async ({ message, args, userService }) => {
        if (!message.member || !message.member.permissions.has('Administrator')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        // Extraer argumentos
        const [arg1, arg2] = args;
        const validSocials = ['patreon', 'boosty'];

        let nickname = null;
        let selectedSocial = null;

        // Determinar si los argumentos contienen socialType
        if (arg1 && validSocials.includes(arg1.toLowerCase())) {
            // Solo se pasó el tipo de red social (para el usuario actual)
            selectedSocial = arg1.toLowerCase();
        } else if (arg2 && validSocials.includes(arg2.toLowerCase())) {
            // Se pasó nickname + tipo de red social
            nickname = arg1;
            selectedSocial = arg2.toLowerCase();
        } else if (arg1) {
            // Se pasó solo nickname
            nickname = arg1;
        }

        try {
            // Si no se proporcionó nickname, usar el del autor
            if (!nickname) {
                const username = message.author.username;
                nickname = await userService.getNicknameBySocialId('discord', username);
                if (!nickname) {
                    return message.reply('❌ Please register using the form before checking your supporter status.');
                }
            }

            let response = `🎉 **Supporter Status for ${nickname}:**\n`;

            if (selectedSocial) {
                const tier = await userService.getSupporterTier(nickname, selectedSocial);
                if (tier) {
                    response += `${capitalize(selectedSocial)} Tier: ${tier}`;
                } else {
                    response += `${capitalize(selectedSocial)} Tier: Not a ${capitalize(selectedSocial)} supporter`;
                }
            } else {
                const patreonTier = await userService.getSupporterTier(nickname, 'patreon');
                const boostyTier = await userService.getSupporterTier(nickname, 'boosty');

                response += patreonTier
                    ? `Patreon Tier: ${patreonTier}\n`
                    : `Patreon Tier: Not a Patreon supporter\n`;
                response += boostyTier
                    ? `Boosty Tier: ${boostyTier}\n`
                    : `Boosty Tier: Not a Boosty supporter\n`;
        }

            message.reply(response);
        } catch (error) {
            console.error('❌ Error while retrieving supporter status:', error);
            message.reply('❌ An error occurred while retrieving the supporter status. Please try again later.');
        }
    }
};