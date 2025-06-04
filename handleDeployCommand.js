// deploy-commands.js
import { REST, Routes } from 'discord.js';
import { CONFIG } from './config/config.js';
import fs from 'fs';
import path from 'path';

const commands = [];
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(CONFIG.discordBotToken);

try {
  console.log('🔄 Registrando comandos...');
  await rest.put(
    Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId),
    { body: commands }
  );
  console.log('✅ Comandos registrados con éxito.');
} catch (error) {
  console.error('❌ Error al registrar comandos:', error);
}
