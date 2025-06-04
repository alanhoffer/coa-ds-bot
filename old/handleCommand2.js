
import fs from 'fs/promises';
import User from './entities/User.js';
import { generateTopImage, generateUserBanner } from './utils/generateTopImage.js';
import { CHEST_REWARDS, CHEST_PRICE, CLAIM_FILE, CLAIM_ROLE_NAME, COMMANDS_PREFIX } from './config/config.js';
import { createPoolWithTunnel, createPoolWithoutTunnel } from './utils/conection.js';


const pool = await createPoolWithTunnel();
const userService = new User(pool);

export async function handleCommand(message) {
    if (!message.content.startsWith(COMMANDS_PREFIX)) return;

    const args = message.content.slice(COMMANDS_PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const param1 = args[0];

    if (command === 'help') {
        const helpMessage = `**Comandos disponibles:**
        \`!ranking \` - Muestra el top 5 de usuarios con más puntos.
        \`!points\` - Ver tus puntos actuales.
        \`!level\` - Muestra tu banner con estadísticas.
        \`!chest\` - Muestra información sobre los cofres.
        \`!social\` - Muestra nuestras redes sociales.
        \`!support\` - Muestra información sobre el soporte.
        \`!alpha\` - Muestra informacion sobre la versión alpha.
        \`!rewards \` - Lists daily/weekly login or quest rewards.
        \`!rules \` - Muestra las reglas del servidor.
        \`!referal <código>\` - Reclama puntos usando un código de referal.
        \`!buyexp <cantidad>\` - Compra EXP por **100 puntos cada 100 EXP**
        \`!openchest \` - Abre un cofre por **${CHEST_PRICE} puntos**.
        \`!addpoints @usuario cantidad\` - Agrega puntos a un usuario (solo admins).
        \`!help\` - Muestra este mensaje de ayuda.`;
        message.channel.send(helpMessage);
        return;
    }

    if (command === 'level') {
        const username = message.author.username;
        const discordAvatarURL = message.author.displayAvatarURL({ format: 'png', size: 128 });
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en el form antes de ver tus estadísticas.');
            return;
        }
        try {
            const userStats = await userService.getUserStatsByNickname(nickname);
            if (!userStats) {
                message.reply('❌ No se encontraron estadísticas para tu usuario.');
                return;
            }

            // Agregar avatar Discord al userStats para el banner
            userStats.avatarPath = discordAvatarURL;

            const imagePath = await generateUserBanner(userStats);
            await message.reply({
                content: `Aquí tienes tu banner, ${userStats.nickname}!`,
                files: [imagePath]
            });
        } catch (error) {
            console.error(error);
            message.reply('❌ Ocurrió un error al obtener tus estadísticas. Inténtalo de nuevo más tarde.');
        }
        return;
    }

    if (command === 'rules') {
        const rulesMessage = `**Reglas del servidor:**
1. **Respeto mutuo**: Trata a todos los miembros con respeto. No se tolerarán insultos, acoso o discriminación.
2. **Contenido apropiado**: No se permite contenido NSFW, violento o ilegal. Mantén el chat amigable para todas las edades.
3. **No spam**: Evita enviar mensajes repetitivos o irrelevantes. Usa los canales adecuados para cada tema.
4. **Canales específicos**: Usa los canales designados para cada tipo de contenido (juegos, memes, anuncios, etc.).
5. **Moderación**: Sigue las instrucciones de los moderadores y administradores. Ellos están aquí para mantener un ambiente agradable.
6. **Publicidad**: No se permite hacer publicidad de otros servidores o canales sin permiso previo.
7. **Reclamos y quejas**: Si tienes un problema, dirígete a un moderador en privado. No hagas reclamos públicos.
8. **Diviértete**: Este es un lugar para disfrutar y compartir. Participa en las actividades y haz nuevos amigos.

**¡Gracias por ser parte de nuestra comunidad!**`;
        message.channel.send(rulesMessage);
        return;
    }


    if (command === 'alpha') {
        // Muestra información sobre la versión alpha del juego que se lanzará en diciembre
        const alphaInfo = `**¡Bienvenido a la versión Alpha de Clash of Adventurers!**
Estamos emocionados de que formes parte de esta etapa temprana del juego. Aquí tienes algunos detalles importantes:
- **Fecha de lanzamiento**: La versión Alpha se lanzará en diciembre.
- **Acceso exclusivo**: Tendrás acceso a una key mediante puntos y niveles.
- **Feedback**: Tu opinión es crucial. Reporta bugs, comparte sugerencias y ayúdanos a mejorar.
- **Recompensas**: Puedes obtener recompensas participando en las redes sociales.
- **Comunidad**: Interactúa con otros jugadores, desarrolladores y mantente al tanto de las novedades.

**¡Gracias por unirte a la aventura de Clash of Adventurers!**`;
        message.channel.send(alphaInfo);
        return;
    }

    if (command === 'support') {
        const supportMessage = `**¿Necesitas ayuda? Aquí tienes cómo contactarnos:**
- **Discord**: Puedes crear un ticket en Discord para soporte técnico o preguntas generales.
- **Email**: Puedes enviarnos un correo a support@test.com
- **Redes Sociales**: También puedes contactarnos a través de nuestras redes sociales.

**¡Estamos aquí para ayudarte!**`;
        message.channel.send(supportMessage);
        return;
    }

    if (command === 'rewards') {
        const rewardsMessage = `**Recompensas disponibles:**
- **Recompensas diarias**: Puedes reclamar recompensas diarias cada 24 horas.
- **Recompensas semanales**: Cada semana puedes reclamar recompensas especiales.
- **Misiones**: Completa misiones para obtener recompensas adicionales.
- **Eventos especiales**: Participa en eventos para ganar recompensas únicas.

**¡No olvides reclamar tus recompensas regularmente!**`;
        message.channel.send(rewardsMessage);
        return;
    }

    if (command === 'socials' || command === 'social') {
        const socialsMessage = `**Síguenos en nuestras redes sociales:**
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
        \`!openchest\` - Abre un cofre por **${CHEST_PRICE} puntos** y recibe una recompensa aleatoria.
        Recompensas posibles:
        \`50 Puntos (probabilidad 50%)\`
        \`100 Puntos (probabilidad 30%)\`
        \`500 Puntos (probabilidad 15%)\`
        \`First Adventurer level (probabilidad 0.5%, cofre misterioso que otorga el primer nivel de aventurero)\``;
        message.channel.send(chestInfo);
        return;
    }

    if (command === 'buyexp') {
        // Muestra información sobre la compra de EXP
        const expInfo = `**Compra de EXP:**
        \`!buyexp <cantidad>\` - Compra EXP por **100 puntos cada 100 EXP**.
        `;
        if (args.length < 1 || isNaN(args[0]) || parseInt(args[0]) <= 0) {
            message.reply('❌ Uso correcto: `!buyexp <cantidad>` (ejemplo: `!buyexp 500` para comprar 500 EXP)');
            return;
        }
        const amount = parseInt(args[0]);
        const username = message.author.username;
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en el form antes de comprar EXP.');
            return;
        }
        try {
            const points = await userService.getPoints(nickname);
            const cost = Math.ceil(amount / 100) * 100; // 100 puntos por cada 100 EXP
            if (points < cost) {
                message.reply(`❌ Necesitas al menos ${cost} puntos para comprar ${amount} EXP.`);
                return;
            }

            // Resta puntos por la compra
            await userService.addPoints(nickname, -cost);

            // Agrega la EXP al usuario
            const leveledUp = await userService.addExp(nickname, amount);

            let response = `🎉 ¡Compraste **${amount} EXP** por **${cost} puntos**!`;
            if (leveledUp) {
                response += ` 🔼 ¡Subiste de nivel de aventurero!`;
            }

            message.reply(response);
        } catch (error) {
            console.error(error);
            message.reply('❌ Ocurrió un error al comprar EXP. Inténtalo de nuevo más tarde.');
        }
        return;
    }

    if (command === 'openchest') {
        const username = message.author.username;
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en el form antes de abrir cofres.');
            return;
        }

        try {
            const points = await userService.getPoints(nickname);
            if (points < CHEST_PRICE) {
                message.reply(`❌ Necesitas al menos ${CHEST_PRICE} puntos para abrir un cofre.`);
                return;
            }

            // Resta puntos por abrir el cofre
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
                await userService.addUserLevel(nickname, 1);
                message.reply(`🎉 ¡Abriste un cofre misterioso y recibiste el primer nivel de aventurero!`);
                return;
            }

            // Recompensa de EXP
            const leveledUp = await userService.addExp(nickname, reward.reward);

            let response = `🎉 ¡Abriste un cofre y ganaste **${reward.reward} EXP**!`;
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
        // ver puntos del usuario
        const username = message.author.username;
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en el form antes de ver tus puntos.');
            return;
        }
        try {
            const points = await userService.getPoints(nickname);
            message.reply(
                `🎉 ¡Hola **${nickname}** !\n` +
                `🔹 Actualmente tienes **${points}** puntos.\n\n` +
                `🔹 Puedes ganar más puntos viendo los streams, participando en el chat, reaccionando, completando desafíos ¡y mucho más!\n` +
                `🔹 Usa \`!redeem\` para canjear recompensas cuando tengas suficientes.\n\n` +
                `🚀 ¡Sigue participando y escala en el ranking!`
            );
        } catch (error) {
            console.error(error);
            message.reply('❌ Ocurrió un error al obtener tus puntos.');
        }
        return;
    }

    if (command === 'ranking') {
        try {
            const topUsers = await userService.getTopUsers();
            if (topUsers.length === 0) {
                message.reply('❌ No se encontraron usuarios con puntos.');
                return;
            }

            const imagePath = await generateTopImage(topUsers);

            await message.reply({
                content: `🏆 **Top 5 usuarios con más puntos**`,
                files: [imagePath]
            });

        } catch (err) {
            console.error(err);
            message.reply('❌ Ocurrió un error al generar el ranking.');
        }
    }


    if (command === 'referal') {
        const userId = message.author.id;
        const username = message.author.username;

        // Validar que pusieron un código
        if (!param1) {
            message.reply('❌ Debes usar un código. Ejemplo: `!referal streamer1`');
            return;
        }

        // Cargar datos
        let claimData = {};
        try {
            const data = await fs.readFile(CLAIM_FILE, 'utf8');
            claimData = JSON.parse(data);
        } catch (e) {
            claimData = {};
        }

        // Validar que el código exista
        if (!claimData[param1]) {
            message.reply(`❌ El código "${param1}" no es válido.`);
            return;
        }

        const codeInfo = claimData[param1];
        const alreadyClaimed = codeInfo.claimedBy?.includes(userId);

        if (alreadyClaimed) {
            message.reply(`❌ Ya usaste el código "${param1}".`);
            return;
        }

        // Agregar usuario a lista de quienes lo reclamaron
        codeInfo.claimedBy = codeInfo.claimedBy || [];
        codeInfo.claimedBy.push(userId);

        // Dar puntos al usuario
        const nickname = await userService.getNicknameBySocialId('discord', username);
        if (!nickname) {
            message.reply('❌ Registrate en el form antes de reclamar un código.');
            return;
        }

        // Dar puntos al streamer
        if (!codeInfo.streamerId) {
            message.reply(`❌ El código "${param1}" no tiene un streamer asociado.`);
            return;
        }

        const streamerNickname = await userService.getNicknameBySocialId('discord', codeInfo.streamerId);
        if (!streamerNickname) {
            message.reply(`❌ El streamer asociado al código "${param1}" no está registrado.`);
            return;
        }
        try {

            await userService.addPoints(streamerNickname, codeInfo.streamerPoints);
            await userService.addPoints(nickname, codeInfo.userPoints);

        } catch (error) {
            console.error('❌ Error al agregar puntos al streamer:', error.message);
            message.reply('❌ Ocurrió un error al dar puntos al streamer.');
            return;
        }
        console.log(`Dando ${codeInfo.userPoints} puntos a ${username} por código ${param1}`);


        try {
            const guild = message.guild;
            if (!guild) {
                message.reply('❌ No se pudo obtener el servidor.');
                return;
            }

            const member = await guild.members.fetch(userId);
            if (!member) {
                message.reply('❌ No se pudo obtener tu miembro en el servidor.');
                return;
            }

            const role = guild.roles.cache.find(r => r.name === CLAIM_ROLE_NAME);
            if (!role) {
                message.reply(`❌ No se encontró el rol "${CLAIM_ROLE_NAME}" en el servidor.`);
                console.log(`❌ Roles disponibles: ${guild.roles.cache.map(r => r.name).join(', ')}`);
                return;
            }

            await member.roles.add(role);
            console.log(`✅ Rol "${role.name}" asignado a ${member.user.tag}`);
        } catch (error) {
            console.error('❌ Error asignando rol:', error);
            message.reply('❌ Ocurrió un error al asignar el rol. Revisa los permisos del bot.');
        }


        // Guardar cambios
        await fs.writeFile(CLAIM_FILE, JSON.stringify(claimData, null, 2));

        message.reply(`✅ ¡Reclamaste ${codeInfo.userPoints} puntos con el código "${param1}" y recibiste el rol "${CLAIM_ROLE_NAME}"! 🎉`);
    }

    if (command === 'addpoints') {
        // Solo admins pueden usarlo
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ No tienes permiso para usar este comando.');
        }

        const userMention = args[0];
        const pointsToAdd = parseInt(args[1], 10);

        if (!userMention || isNaN(pointsToAdd)) {
            return message.reply('Uso correcto: !addpoints @usuario cantidad');
        }
        console.log(`Agregando ${pointsToAdd} puntos a ${userMention}`);
        const user = message.mentions.users.first().username;
        if (!user) {
            return message.reply('Debes mencionar a un usuario válido.');
        }

        let nickname = await userService.getNicknameBySocialId('discord', user);
        if (!nickname) {
            return message.reply('Usuario no registrado.');
        }

        try {
            await userService.addPoints(nickname, pointsToAdd);
            message.channel.send(`✅ Se sumaron ${pointsToAdd} puntos a ** ${nickname} **.`);
        } catch (error) {
            console.error(error);
            message.channel.send('❌ Error al agregar puntos.');
        }
    }

    // Aquí puedes agregar más comandos con else if
}
