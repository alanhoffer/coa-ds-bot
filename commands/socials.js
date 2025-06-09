export default {
    name: "socials",
    description: "Shows social media links.",
    run: async ({ message, args, userService }) => {
        const socialsMessage = `**Follow us on our social media:**
**Twitch:** <https://www.twitch.tv/bija>
**YouTube:** <https://www.youtube.com/@bijagaming>
**Twitter:** <https://twitter.com/BijaGaming>
**Discord:** <https://discord.gg/bija>
**TikTok:** <https://www.tiktok.com/@bijagaming>
**Instagram:** <https://www.instagram.com/bijagaming/>
**Facebook:** <https://www.facebook.com/bijagaming>`;
        message.channel.send(socialsMessage);
    }
};