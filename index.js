import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import { BOOSTER_ROLE_ID, CONFIG } from './config/config.js';
import { handleCommand } from './handleCommand.js'; // (opcional si usas slash commands)
import { handlePointsPerMessage } from './utils/pointsPerMessage.js'; // función para sumar puntos
import { COMMANDS_PREFIX, RULES_CHANNEL_ID, WELCOME_CHANNEL_ID } from './config/config.js';


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});


client.once('ready', async () => {
    console.log(`Bot listo como ${client.user.tag}`);

});

client.on('guildMemberAdd', async (member) => {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00FF99)
        .setTitle('🎉 A new adventurer has arrived!')
        .setDescription(`👋 Hey <@${member.id}>, welcome to the **Clash of Adventurers** Official Discord Server!\n`
            + `Check <#${RULES_CHANNEL_ID}> and \`!help\` to get started.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: 'Get ready for the adventure!' });

    channel.send({ embeds: [welcomeEmbed] });
});


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Primero chequear si es comando y manejarlo
    if (message.content.startsWith(COMMANDS_PREFIX)) {
        await handleCommand(message);
        return; // Opcional: no sumar puntos si es comando, o quita el return para sumar puntos también
    }

    // Si no es comando, sumar puntos por mensaje / media
    await handlePointsPerMessage(message);
});


client.on('guildMemberUpdate', async (oldMember, newMember) => {
  // Si antes no estaba boosteando y ahora sí
  if (!oldMember.premiumSince && newMember.premiumSince) {
    try {
      await newMember.roles.add(BOOSTER_ROLE_ID);
      console.log(`Se le asignó el rol de booster a ${newMember.user.tag}`);
    } catch (error) {
      console.error('Error asignando rol de booster:', error);
    }
  }

  // También podrías manejar el caso de que deje de boostear si quieres
  if (oldMember.premiumSince && !newMember.premiumSince) {
    try {
      await newMember.roles.remove(BOOSTER_ROLE_ID);
      console.log(`Se le removió el rol de booster a ${newMember.user.tag}`);
    } catch (error) {
      console.error('Error removiendo rol de booster:', error);
    }
  }
});

client.login(CONFIG.discordBotToken);
