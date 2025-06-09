export async function setlevel(message, args, userService) {
    // Only admins can use this
    if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply('❌ You do not have permission to use this command.');
    }

    const nickname = args[0];
    const level = parseInt(args[1], 10);

    if (!nickname || isNaN(level)) {
        return message.reply('Correct usage: !setlevel username level');
    }

    console.log(`Setting level ${level} for ${nickname}`);

    try {
        await userService.setUserLevel(nickname, level);
        message.channel.send(`✅ Level of **${nickname}** was set to **${level}**.`);
    } catch (error) {
        console.error(error);
        message.channel.send('❌ Error while setting level.');
    }
}