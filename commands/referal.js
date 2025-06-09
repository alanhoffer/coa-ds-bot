import fs from 'fs/promises';
import { CLAIM_FILE, CLAIM_ROLE_NAME } from '../config/config.js';

export default {
    name: "referal",
    description: "Claims a referral code.",
    run: async ({ message, args, userService }) => {
        const userId = message.author.id;
        const username = message.author.username;
        const param1 = args[0];

        // Validate that a code was provided
        if (!param1) {
            message.reply('❌ You must provide a code. Example: `!referal <code>`');
            return;
        }

        // Load data
        let claimData = {};
        try {
            const data = await fs.readFile(CLAIM_FILE, 'utf8');
            claimData = JSON.parse(data);
        } catch (e) {
            claimData = {};
        }

        // Verificar si el usuario ya reclamó algún código
        const hasClaimedAny = Object.values(claimData).some(c => c.claimedBy?.includes(userId));
        if (hasClaimedAny) {
            message.reply('❌ You have already claimed a referral code before. Only one claim is allowed per user.');
            return;
        }

        // Validate that the code exists
        if (!claimData[param1]) {
            message.reply(`❌ The code "${param1}" is not valid.`);
            return;
        }

        const codeInfo = claimData[param1];
        const alreadyClaimed = codeInfo.claimedBy?.includes(userId);

        if (alreadyClaimed) {
            // Esta validación es redundante ahora, pero la dejo por seguridad
            message.reply(`❌ You have already used the code "${param1}".`);
            return;
        }

        // Add user to the claimed list
        codeInfo.claimedBy = codeInfo.claimedBy || [];
        codeInfo.claimedBy.push(userId);

        // Give Points to the user
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Please register using the form before claiming a code.');
            return;
        }

        // Give Points to the streamer
        if (!codeInfo.streamerId) {
            message.reply(`❌ The code "${param1}" has no associated streamer.`);
            return;
        }

        const streamerNickname = await userService.getNicknameBySocialId('discord', codeInfo.streamerId);
        if (!streamerNickname) {
            message.reply(`❌ The streamer associated with the code "${param1}" is not registered.`);
            return;
        }

        try {
            await userService.addPoints(streamerNickname, codeInfo.streamerPoints);
            await userService.addPoints(nickname, codeInfo.userPoints);
        } catch (error) {
            console.error('❌ Error while adding Points to the streamer:', error.message);
            message.reply('❌ An error occurred while giving Points to the streamer.');
            return;
        }

        console.log(`Giving ${codeInfo.userPoints} Points to ${username} for using code ${param1}`);

        try {
            const guild = message.guild;
            if (!guild) {
                message.reply('❌ Could not retrieve the server.');
                return;
            }

            const member = await guild.members.fetch(userId);
            if (!member) {
                message.reply('❌ Could not retrieve your member info from the server.');
                return;
            }

            const role = guild.roles.cache.find(r => r.name === CLAIM_ROLE_NAME);
            if (!role) {
                message.reply(`❌ The role "${CLAIM_ROLE_NAME}" was not found in the server.`);
                console.log(`❌ Available roles: ${guild.roles.cache.map(r => r.name).join(', ')}`);
                return;
            }

            await member.roles.add(role);
            console.log(`✅ Role "${role.name}" assigned to ${member.user.tag}`);
        } catch (error) {
            console.error('❌ Error assigning role:', error);
            message.reply('❌ An error occurred while assigning the role. Check the bot’s permissions.');
        }

        // Save changes
        await fs.writeFile(CLAIM_FILE, JSON.stringify(claimData, null, 2));

        message.reply(`✅ You claimed ${codeInfo.userPoints} Points with the code "${param1}" and received the "${CLAIM_ROLE_NAME}" role! 🎉`);
    }
};