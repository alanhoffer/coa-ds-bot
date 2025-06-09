export default {
    name: "getlevel",
    description: "Gets the level of a user.",
    run: async ({ message, args, userService }) => {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const nickname = args[0];

        if (!nickname) {
            return message.reply('Correct usage: !getlevel username');
        }

        console.log(`Retrieving level for ${nickname}`);

        try {
            const level = await userService.getUserLevel(nickname);
            message.channel.send(`**${nickname}** has adventurer level **${level}**.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error while retrieving user level.');
        }
    }
};