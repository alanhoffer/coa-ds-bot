export default {
    name: "addlevel",
    description: "Adds a level to a user.",
    run: async ({ message, args, userService }) => {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const nickname = args[0];

        if (!nickname) {
            return message.reply('Correct usage: !addlevel username');
        }

        console.log(`Adding level to ${nickname}`);

        try {
            const newLevel = await userService.addUserLevel(nickname);
            message.channel.send(`✅ One level was added to **${nickname}**. New level: **${newLevel}**.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error while adding level.');
        }
    }
};