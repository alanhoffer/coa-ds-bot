import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import { CONFIG } from './config/config.js';
import { handleCommand } from './handleCommand.js'; // (opcional si usas slash commands)
import { handlePointsPerMessage } from './utils/pointsPerMessage.js'; // función para sumar puntos
import { COMMANDS_PREFIX, WELCOME_CHANNEL_ID } from './config/config.js';
import { getRolePickers } from './utils/roleStorage.js';



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();
const commands = [];

const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(CONFIG.discordBotToken);
await rest.put(
    Routes.applicationCommands(CONFIG.clientId),
    { body: commands }
);


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
            + `Check \`!rules\` and \`!help\` to get started.`)
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    const pickers = await getRolePickers();
    const roles = pickers[interaction.message.id];
    if (!roles) return;

    const selected = interaction.values[0];
    const role = interaction.guild.roles.cache.find(r => r.name === selected);
    if (!role) {
        return interaction.reply({ content: `Rol "${selected}" no encontrado.`, ephemeral: true });
    }

    const member = interaction.member;
    if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return interaction.reply({ content: `Rol "${selected}" removido.`, ephemeral: true });
    } else {
        await member.roles.add(role);
        return interaction.reply({ content: `Rol "${selected}" asignado.`, ephemeral: true });
    }
});

client.login(CONFIG.discordBotToken);
