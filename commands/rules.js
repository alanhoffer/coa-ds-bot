export default {
    name: "rules",
    description: "Shows the server rules.",
    run: async ({ message, args, userService }) => {
        const rulesMessage = `**Server Rules:**
1. **Mutual respect**: Treat all members with respect. Insults, harassment, or discrimination will not be tolerated.
2. **Appropriate content**: NSFW, violent, or illegal content is not allowed. Keep the chat friendly for all ages.
3. **No spam**: Avoid sending repetitive or irrelevant messages. Use the appropriate channels for each topic.
4. **Specific channels**: Use the designated channels for each type of content (games, memes, announcements, etc.).
5. **Moderation**: Follow the instructions of moderators and admins. They are here to maintain a pleasant environment.
6. **Advertising**: Advertising other servers or channels is not allowed without prior permission.
7. **Complaints and issues**: If you have a problem, contact a moderator privately. Do not make public complaints.
8. **Have fun**: This is a place to enjoy and share. Participate in activities and make new friends.

**Thank you for being part of our community!**`;
        message.channel.send(rulesMessage);
    }
};