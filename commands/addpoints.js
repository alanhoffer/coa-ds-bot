export default {
    name: "addpoints",
    description: "Adds points to a user.",
    run: async ({ message, args, userService }) => {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const nickname = args[0];
        const pointsToAdd = parseInt(args[1], 10);

        if (!nickname || isNaN(pointsToAdd)) {
            return message.reply('Correct usage: !addpoints username amount');
        }

        console.log(`Adding ${pointsToAdd} Points to ${nickname}`);

        try {
            await userService.addPoints(nickname, pointsToAdd);
            message.channel.send(`✅ Added ${pointsToAdd} Points to **${nickname}**.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error while adding Points.');
        }
    }
};