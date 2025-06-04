import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { saveRolePicker } from '../utils/roleStorage.js';

export const data = new SlashCommandBuilder()
    .setName('rolepicker')
    .setDescription('Crea un role picker interactivo.')
    .addStringOption(option =>
        option.setName('titulo')
            .setDescription('Título del mensaje')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('roles')
            .setDescription('Roles separados por coma (ej. "Warrior,Mage,Healer")')
            .setRequired(true));

export async function execute(interaction) {
    const title = interaction.options.getString('titulo');
    const roles = interaction.options.getString('roles').split(',').map(r => r.trim());

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('rolepicker')
        .setPlaceholder('Selecciona un rol')
        .addOptions(roles.map(role => ({
            label: role,
            value: role
        })));

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription('Selecciona uno de los roles disponibles:')
        .setColor(0x00AE86);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    await saveRolePicker(msg.id, roles);

    console.log(`RolePicker creado con ID ${msg.id}`);
}
