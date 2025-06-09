export default {
    name: "getpoints",
    description: "Gets the points of a user.",
    run: async ({ message, args, userService }) => {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const nickname = args[0];

        if (!nickname) {
            return message.reply('Correct usage: !getPoints username');
        }

        console.log(`Retrieving Points for ${nickname}`);

        try {
            const points = await userService.getPoints(nickname);
            message.channel.send(`**${nickname}** has **${points}** Points.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error while retrieving Points.');
        }
    }
};