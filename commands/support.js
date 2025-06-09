export default {
    name: "support",
    description: "Shows support information.",
    run: async ({ message, args, userService }) => {
        const supportMessage = `**Need help? Here’s how to contact us:**
- **Discord**: You can create a ticket on Discord for technical support or general questions.
- **Email**: You can send us an email at support@test.com
- **Social Media**: You can also reach us through our social media channels.

**We’re here to help you!**`;
        message.channel.send(supportMessage);
    }
};