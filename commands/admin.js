export default {
    name: "admin",
    description: "Shows the admin help message with available commands.",
    run: async ({ message, args, userService }) => {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const adminHelpMessage = `**Administrator Commands:**
    \`!addpoints <user> <amount>\` - Adds Points to a user.
    \`!getPoints <user>\` - Retrieves a user's Points.
    \`!updatesupporter <nickname> <patreon|boosty> <tier>\` - Adds a level to a user.
    \`!getsupporter <user>\` - Adds a level to a user.
    \`!setlevel <user>\` - Adds a level to a user.
    \`!setlevel <user>\` - Adds a level to a user.
    \`!getlevel <user>\` - Retrieves a user's adventurer level.`;
        message.channel.send(adminHelpMessage);
    }
};