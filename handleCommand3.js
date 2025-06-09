import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import User from './entities/User.js';
import { queryWithReconnect } from './utils/conection.js';
import { COMMANDS_PREFIX } from './config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.resolve(__dirname, 'commands');

const userService = new User(queryWithReconnect);
const commands = {};

async function loadCommands() {
  const files = await fs.readdir(commandsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const modulePath = path.join(commandsDir, file);
      // ESTA ES LA LÍNEA CLAVE:
      const cmd = (await import(pathToFileURL(modulePath).href)).default;
      commands[cmd.name] = cmd;
    }
  }
}

await loadCommands();

export async function handleCommand(message) {
  if (!message.content.startsWith(COMMANDS_PREFIX)) return;
  const args = message.content.slice(COMMANDS_PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands[commandName];
  if (!command) return;
  try {
    await command.run({ message, args, userService });
  } catch (error) {
    console.error(`Error ejecutando el comando ${commandName}:`, error);
    message.reply('❌ Error ejecutando el comando.');
  }
}