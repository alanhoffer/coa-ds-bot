
import fs from 'fs/promises';
import User from './entities/User.js';
import { generateTopImage, generateUserBanner } from './utils/generateTopImage.js';
import { CHEST_REWARDS, CHEST_PRICE, CLAIM_FILE, CLAIM_ROLE_NAME, COMMANDS_PREFIX } from './config/config.js';
import { queryWithReconnect } from './utils/conection.js';
import { capitalize } from './helpers/Capitalize.js';


const userService = new User(queryWithReconnect);


export async function handleCommand(message) {
    if (!message.content.startsWith(COMMANDS_PREFIX)) return;

    const args = message.content.slice(COMMANDS_PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const param1 = args[0];

    if (command === 'help') {
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
        return;
    }
    // obtain suppoter passing nickname & socialType
    if (command === 'getsupporter') {
        if (!message.member || !message.member.permissions.has('Administrator')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        // Extraer argumentos
        const [arg1, arg2] = args;
        const validSocials = ['patreon', 'boosty'];

        let nickname = null;
        let selectedSocial = null;

        // Determinar si los argumentos contienen socialType
        if (arg1 && validSocials.includes(arg1.toLowerCase())) {
            // Solo se pasó el tipo de red social (para el usuario actual)
            selectedSocial = arg1.toLowerCase();
        } else if (arg2 && validSocials.includes(arg2.toLowerCase())) {
            // Se pasó nickname + tipo de red social
            nickname = arg1;
            selectedSocial = arg2.toLowerCase();
        } else if (arg1) {
            // Se pasó solo nickname
            nickname = arg1;
        }

        try {
            // Si no se proporcionó nickname, usar el del autor
            if (!nickname) {
                const username = message.author.username;
                nickname = await userService.getNicknameBySocialId('discord', username);
                if (!nickname) {
                    return message.reply('❌ Please register using the !web before checking your supporter status.');
                }
            }

            let response = `🎉 **Supporter Status for ${nickname}:**\n`;

            if (selectedSocial) {
                const tier = await userService.getSupporterTier(nickname, selectedSocial);
                if (tier) {
                    response += `${capitalize(selectedSocial)} Tier: ${tier}`;
                } else {
                    response += `${capitalize(selectedSocial)} Tier: Not a ${capitalize(selectedSocial)} supporter`;
                }
            } else {
                const patreonTier = await userService.getSupporterTier(nickname, 'patreon');
                const boostyTier = await userService.getSupporterTier(nickname, 'boosty');

                response += patreonTier
                    ? `Patreon Tier: ${patreonTier}\n`
                    : `Patreon Tier: Not a Patreon supporter\n`;
                response += boostyTier
                    ? `Boosty Tier: ${boostyTier}\n`
                    : `Boosty Tier: Not a Boosty supporter\n`;
            }

            message.reply(response);
        } catch (error) {
            console.error('❌ Error while retrieving supporter status:', error);
            message.reply('❌ An error occurred while retrieving the supporter status. Please try again later.');
        }
    }

    if (message.content.startsWith('!addsocial')) {
        const args = message.content.trim().split(/\s+/).slice(1);

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (args.length < 3) {
            return message.reply('❌ Correct usage: `!addsocial <nickname> <twitch|youtube> <socialId>`');
        }

        const nickname = args.slice(0, -2).join(' ');
        const socialType = args[args.length - 2];
        const socialId = args[args.length - 1];

        try {
            await userService.addSocialToNickname(nickname, socialType, socialId);
            message.reply(`✅ Social media **${socialType}** successfully added for nickname **${nickname}**.`);
        } catch (error) {
            message.reply(`❌ Error: ${error.message}`);
        }
    }


    if (command === 'getsocials') {
        const args = message.content.trim().split(/\s+/).slice(1); // quitar el comando

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (args.length < 1) {
            return message.reply('❌ Usage: `!getsocials <nickname>`');
        }
        const nickname = args[0];
        try {
            const socials = await userService.getSocialsByNickname(nickname);
            if (!socials || Object.keys(socials).length === 0) {
                return message.reply(`❌ No social media found for nickname **${nickname}**.`);
            }
            let response = `**Social media for ${nickname}:**\n`;
            for (const [type, id] of Object.entries(socials)) {
                response += `- **${capitalize(type)}**: ${id}\n`;
            }
            message.reply(response);
        } catch (error) {

            console.error('❌ Error retrieving socials:', error);
            message.reply('❌ An error occurred while retrieving the social media. Please try again later.');
        }
    }



    if (command === 'updatesupporter') {
        if (!message.member || !message.member.permissions.has('Administrator')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const [nickname, socialType, tierArg] = args;

        if (!nickname || !socialType || !tierArg) {
            return message.reply('❌ Usage: !updatesupporter <nickname> <patreon|boosty> <tier>');
        }

        const tier = parseInt(tierArg, 10);
        if (isNaN(tier) || tier < 0) {
            return message.reply('❌ Tier must be a positive integer (0 or higher).');
        }

        const validSocials = ['patreon', 'boosty'];
        if (!validSocials.includes(socialType.toLowerCase())) {
            return message.reply('❌ Invalid social type. Use "patreon" or "boosty".');
        }

        try {
            const success = await userService.updateSupporterTier(nickname, socialType, tier);
            if (success) {
                return message.reply(`✅ Successfully updated ${capitalize(socialType)} tier for **${nickname}** to **${tier}**.`);
            } else {
                return message.reply('❌ Failed to update supporter tier. Please check the nickname.');
            }
        } catch (error) {
            console.error('❌ Error updating supporter tier:', error);
            return message.reply('❌ An error occurred while updating the supporter tier.');
        }
    }


    if (command === 'admin') {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }
        const adminHelpMessage = `**Administrator Commands:**
    \`!addpoints <user> <amount>\` - Adds Points to a user.
    \`!getPoints <user>\` - Retrieves a user's Points.
    \`!updatesupporter <nickname> <patreon|boosty> <tier>\` - Adds a level to a user.
    \`!getsupporter <user>\` - Adds a level to a user.
    \`!setlevel <user>\` - Adds a level to a user.
    \`!setlevel <user>\` - Adds a level to a user.
    \`!getlevel <user>\` - Retrieves a user's adventurer level.`;
        message.channel.send(adminHelpMessage);
        return;
    }

    if (command === 'web') {

        const formMessage = `**Register your Nickname and Socials:**
    🔗https://clashofadventurers.com/firstadventurer-form`;
        message.channel.send(formMessage);
        return;
    }



    if (command === 'level') {
        const username = message.author.username;
        const discordAvatarURL = message.author.displayAvatarURL({ format: 'png', size: 128 });
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply(`❌ Please register in the form before viewing your stats.
                🔗https://clashofadventurers.com/firstadventurer-form`);
            return;
        }
        try {
            const userStats = await userService.getUserStatsByNickname(nickname);
            if (!userStats) {
                message.reply('❌ No stats were found for your user.');
                return;
            }

            // Add Discord avatar to userStats for the banner
            userStats.avatarPath = discordAvatarURL;
            console.log(`Generating banner for user: userStats = ${JSON.stringify(userStats)}`);
            const imagePath = await generateUserBanner(userStats);
            await message.reply({
                content: ``,
                files: [imagePath]
            });
        } catch (error) {
            console.error(error);
            message.reply('❌ An error occurred while retrieving your stats. Please try again later.');
        }
        return;
    }


    if (command === 'rules') {
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
        return;
    }

    if (command === 'alpha') {
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
        return;
    }

    if (command === 'support') {
        const supportMessage = `**Need help? Here’s how to contact us:**
- **Discord**: You can create a ticket on Discord for technical support or general questions.
- **Email**: You can send us an email at support@test.com
- **Social Media**: You can also reach us through our social media channels.

**We’re here to help you!**`;
        message.channel.send(supportMessage);
        return;
    }

    if (command === 'rewards') {
        const rewardsMessage = `**Available Rewards:**
- **Daily Rewards**: You can claim daily rewards every 24 hours.
- **Weekly Rewards**: Every week you can claim special rewards.
- **Quests**: Complete quests to earn additional rewards.
- **Special Events**: Participate in events to win unique rewards.

**Don’t forget to claim your rewards regularly!**`;
        message.channel.send(rewardsMessage);
        return;
    }

    if (command === 'socials' || command === 'social') {
        const socialsMessage = `**Follow us on our social media:**
**Twitch:** <https://www.twitch.tv/bija>
**YouTube:** <https://www.youtube.com/@bijagaming>
**Twitter:** <https://twitter.com/BijaGaming>
**Discord:** <https://discord.gg/bija>
**TikTok:** <https://www.tiktok.com/@bijagaming>
**Instagram:** <https://www.instagram.com/bijagaming/>
**Facebook:** <https://www.facebook.com/bijagaming>`;
        message.channel.send(socialsMessage);
        return;
    }


    if (command === 'chest') {
        // Muestra información sobre los cofres
        const chestInfo = `**Cofres disponibles:**
        \`!openchest\` - Abre un cofre por **${CHEST_PRICE} Points** y recibe una recompensa aleatoria.
        Recompensas posibles:
        \`50 Points (probabilidad 50%)\`
        \`100 Points (probabilidad 30%)\`
        \`500 Points (probabilidad 15%)\`
        \`First Adventurer level (probabilidad 0.5%, cofre misterioso que otorga el primer nivel de aventurero)\``;
        message.channel.send(chestInfo);
        return;
    }

    if (command === 'openchest') {
        const username = message.author.username;
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en la !web antes de abrir cofres.');
            return;
        }

        try {
            const points = await userService.getPoints(nickname);
            if (points < CHEST_PRICE) {
                message.reply(`❌ Necesitas al menos ${CHEST_PRICE} Points para abrir un cofre.`);
                return;
            }

            // Resta Points por abrir el cofre
            await userService.addPoints(nickname, -CHEST_PRICE);

            // Selecciona una recompensa aleatoria basada en probabilidades
            let randomValue = Math.random() * 100;
            let reward = null;
            for (const item of CHEST_REWARDS) {
                if (randomValue < item.probability) {
                    reward = item;
                    break;
                }
                randomValue -= item.probability;
            }

            if (!reward) {
                message.reply('❌ Ocurrió un error al abrir el cofre. Inténtalo de nuevo.');
                return;
            }

            if (reward.name === 'Adventurer level') {
                // Da el primer nivel directamente (por ejemplo, fija el nivel 1 si es 0)
                // Podrías hacer algo como:
                await userService.addLevelByNickname(nickname);
                message.reply(`🎉 ¡Abriste un cofre misterioso y recibiste el primer nivel de aventurero!`);
                return;
            }

            // Recompensa de EXP
            const leveledUp = await userService.addPoints(nickname, reward.reward);

            let response = `🎉 ¡Abriste un cofre y ganaste **${reward.reward} Puntos**!`;
            if (leveledUp) {
                response += ` 🔼 ¡Subiste de nivel de aventurero!`;
            }

            message.reply(response);

        } catch (error) {
            console.error(error);
            message.reply('❌ Ocurrió un error al abrir el cofre. Inténtalo de nuevo más tarde.');
        }

        return;
    }

    if (command === 'points') {
        try {
            const username = message.author.username;
            const nickname = await userService.getNicknameBySocialId('discord', username);

            console.log(`Looking up Points for user: ${username} with nickname: ${nickname}`);

            if (!nickname) {
                return message.reply(
                    `❌ You are not registered. Use the form to link your Discord account:\n` +
                    `🔗https://clashofadventurers.com/firstadventurer-form`
                );
            }

            const points = await userService.getPoints(nickname);

            return message.reply(
                `🎉 Hello **${nickname}**!\n` +
                `🔹 You currently have **${points}** Points.\n\n` +
                `🔹 Earn more Points by watching streams, participating in chat, reacting, completing challenges, and much more!\n` +
                `🔹 Use \`!level\` to see your level.\n\n` +
                `🚀 Keep participating and climb the rankings!`
            );
        } catch (error) {
            console.error('Error en el comando !points:', error.message);
            return message.reply('❌ Ocurrió un error al consultar tus puntos. Intenta nuevamente o contacta al admin.');
        }
    }

    if (command === 'ranking') {
        try {
            const topUsers = await userService.getTopUsers();
            if (topUsers.length === 0) {
                message.reply('❌ No users with Points were found.');
                return;
            }

            const imagePath = await generateTopImage(topUsers);

            await message.reply({
                content: `🏆 **Top 5 users with the most Level & Points**`,
                files: [imagePath]
            });

        } catch (err) {
            console.error(err);
            message.reply('❌ An error occurred while generating the ranking.');
        }
    }


    if (command === 'addreferal') {

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (args.length < 4) {
            return message.reply('Uso: !addreferal <codigo> <userPoints> <streamerPoints> <streamerDiscordId>');
        }

        const [codigo, userPointsStr, streamerPointsStr, streamerDiscordId] = args;

        // Leer el JSON actual
        let streamers = {};
        try {
            const data = await fs.readFile(CLAIM_FILE, 'utf8');
            streamers = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('Error leyendo archivo referals:', err);
                return message.reply('Error al leer los datos de referals.');
            }
        }

        if (streamers[codigo]) {
            return message.reply(`El código ${codigo} ya existe.`);
        }

        const userPoints = parseInt(userPointsStr, 10);
        const streamerPoints = parseInt(streamerPointsStr, 10);

        if (isNaN(userPoints) || isNaN(streamerPoints)) {
            return message.reply('Los puntos deben ser números enteros.');
        }

        streamers[codigo] = {
            claimedBy: [],
            userPoints,
            streamerPoints,
            streamerId: streamerDiscordId
        };

        try {
            await fs.writeFile(CLAIM_FILE, JSON.stringify(streamers, null, 2));
        } catch (err) {
            console.error('Error guardando archivo referals:', err);
            return message.reply('Error al guardar los datos de referals.');
        }

        // Crear el rol Guild <codigo> si no existe
        try {
            let guildRole = message.guild.roles.cache.find(r => r.name === `Guild ${codigo}`);
            if (!guildRole) {
                // Función para generar color random en hex
                const getRandomColor = () =>
                    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

                guildRole = await message.guild.roles.create({
                    name: `Guild ${codigo}`,
                    color: getRandomColor(),
                    reason: `Rol creado automáticamente para el referral ${codigo}`
                });
                console.log(`Rol creado: ${guildRole.name} (${guildRole.id})`);
            } else {
                console.log(`El rol ${rolRequerido} ya existe`);
            }
        } catch (error) {
            console.error('Error creando el rol Guild:', error);
            message.reply('⚠️ No pude crear el rol automáticamente. ¿Tengo permisos?');
        }

        message.reply(`Referal '${codigo}' agregado: userPoints=${userPoints}, streamerPoints=${streamerPoints}, streamerDiscordId=${streamerDiscordId}`);
    }

    if (command === 'deletereferal') {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const codeToDelete = args[0];
        if (!codeToDelete) {
            return message.reply('❌ Usage: !deletereferal <codigo>');
        }

        // Leer datos
        let streamers = {};
        try {
            const data = await fs.readFile(CLAIM_FILE, 'utf8');
            streamers = JSON.parse(data);
        } catch (err) {
            console.error('❌ Error reading referral data:', err);
            return message.reply('❌ Failed to read referral data.');
        }

        // Verificar si el código existe
        if (!streamers[codeToDelete]) {
            return message.reply(`❌ The referral code "${codeToDelete}" does not exist.`);
        }

        // Eliminar el código
        delete streamers[codeToDelete];

        try {
            await fs.writeFile(CLAIM_FILE, JSON.stringify(streamers, null, 2));
            message.reply(`✅ Referral code "${codeToDelete}" deleted successfully.`);
        } catch (err) {
            console.error('❌ Error saving referral data:', err);
            message.reply('❌ Failed to save referral data after deletion.');
        }
    }

    if (command === 'referal') {
        const userId = message.author.id;
        const username = message.author.username;

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
            message.reply('❌ Please register using the web before claiming a code.');
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

            const role = guild.roles.cache.find(r => r.name === `Guild ${param1}`);
            if (!role) {
                message.reply(`❌ The role "Guild ${param1}" was not found in the server.`);
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

        message.reply(`✅ You claimed ${codeInfo.userPoints} Points with the code "${param1}" and received the "Guild ${param1}" role! 🎉`);
    }


    if (command === 'addpoints') {
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

    if (command === 'getpoints') {
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

    if (command === 'getlevel') {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const nickname = args[0];

        if (!nickname) {
            return message.reply('Correct usage: !getlevel username');
        }

        console.log(`Retrieving level for ${nickname}`);

        try {
            const level = await userService.getUserLevel(nickname);
            message.channel.send(`**${nickname}** has adventurer level **${level}**.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error while retrieving user level.');
        }
        return;
    }

    // Aquí puedes agregar más comandos con else if
    if (command === 'addlevel') {
        // Only admins can use this
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const nickname = args[0];

        if (!nickname) {
            return message.reply('Correct usage: !addlevel username');
        }

        console.log(`Adding level to ${nickname}`);

        try {
            const newLevel = await userService.addUserLevel(nickname);
            message.channel.send(`✅ One level was added to **${nickname}**. New level: **${newLevel}**.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error while adding level.');
        }
    }

    if (command === 'setlevel') {
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

}
