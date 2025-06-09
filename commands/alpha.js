export default {
    name: "alpha",
    description: "Shows information about the Alpha version of the game.",
    run: async ({ message, args, userService }) => {
        // Shows information about the Alpha version of the game launching in December
        const alphaInfo = `**Welcome to the Alpha version of Clash of Adventurers!**
We’re excited to have you join this early stage of the game. Here are some important details:
- **Launch date**: The Alpha version will be released in December.
- **Exclusive access**: You'll gain access through a key using Points and levels.
- **Feedback**: Your opinion is crucial. Report bugs, share suggestions, and help us improve.
- **Rewards**: You can earn rewards by participating on social media.
- **Community**: Interact with other players, developers, and stay updated on the latest news.

**Thank you for joining the adventure in Clash of Adventurers!**`;
        message.channel.send(alphaInfo);
    }
};