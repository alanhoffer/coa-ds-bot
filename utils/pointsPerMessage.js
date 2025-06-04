import User from '../entities/User.js';
import { POINTS_PER_MEDIA, POINTS_PER_MESSAGE } from '../config/config.js';
import { POINTS_PER_MESSAGE_ALLOWED_CHANNELS } from '../config/config.js';
import { queryWithReconnect } from './conection.js';


const userService = new User(queryWithReconnect);



export async function handlePointsPerMessage(message) {
  if (message.author.bot) return;

  // Solo sumar puntos si el canal es uno de los permitidos
  if (!POINTS_PER_MESSAGE_ALLOWED_CHANNELS.includes(message.channel.id)) return;

  const discordId = message.author.username;
  const nickname = await userService.getNicknameBySocialId('discord', discordId);
  let pointsToAdd = POINTS_PER_MESSAGE;

  if (message.attachments.size > 0) {
    pointsToAdd += POINTS_PER_MEDIA;
  }

  if (nickname) {
    try {
      await userService.addPoints(nickname, pointsToAdd);
      console.log(`➕ ${pointsToAdd} puntos sumados a "${nickname}" por mensaje`);
    } catch (error) {
      console.error('❌ Error al agregar puntos por mensaje:', error.message);
    }
  }
}
