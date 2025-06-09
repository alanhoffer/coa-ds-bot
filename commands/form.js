export default {
    name: "form",
    description: "Shows the registration form link.",
    run: async ({ message, args, userService }) => {
        const formMessage = `**Register your Nickname and Socials:**
    🔗https://forms.gle/c7prmGpDEJpqipAa6`;
        message.channel.send(formMessage);
    }
};