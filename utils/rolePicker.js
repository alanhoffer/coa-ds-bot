// commands/rolepicker.js
import {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  PermissionsBitField
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('rolepicker')
  .setDescription('Crea un selector de roles para que los usuarios elijan')
  .addRoleOption(option =>
    option.setName('rol1').setDescription('Primer rol').setRequired(true))
  .addRoleOption(option =>
    option.setName('rol2').setDescription('Segundo rol').setRequired(false))
  .addRoleOption(option =>
    option.setName('rol3').setDescription('Tercer rol').setRequired(false))
  .addRoleOption(option =>
    option.setName('rol4').setDescription('Cuarto rol').setRequired(false));

export async function execute(interaction) {
  const member = interaction.member;
  if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
  }

  const roles = ['rol1', 'rol2', 'rol3', 'rol4']
    .map(name => interaction.options.getRole(name))
    .filter(Boolean);

  if (roles.length === 0) {
    return interaction.reply({ content: 'Debes seleccionar al menos un rol.', ephemeral: true });
  }

  const options = roles.map(role =>
    new StringSelectMenuOptionBuilder()
      .setLabel(role.name)
      .setValue(role.id));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_roles')
    .setPlaceholder('Elige tus roles')
    .setMinValues(0)
    .setMaxValues(roles.length)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({ content: 'Selecciona tus roles:', components: [row] });
}
