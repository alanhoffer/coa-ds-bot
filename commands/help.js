export default {
    name: "help",
    description: "Shows the help message with available commands.",
    run: async ({ message, args, userService }) => {
        const helpMessage = `**Available Commands:**
    \`!ranking\` - Shows the top 5 users with the most Points.
    \`!points\` - View your current Points.
    \`!level\` - Shows your banner with statistics.
    \`!social\` - Shows our social media links.
    \`!support\` - Displays support information.
    \`!alpha\` - Shows information about the alpha version.
    \`!rewards\` - Lists daily/weekly login or quest rewards.
    \`!referal <code>\` - Claim Points using a referral code.
    \`!help\` - Shows this help message.`;
        message.channel.send(helpMessage);
    }
};