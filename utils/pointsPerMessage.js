import User from '../entities/User.js';
import { POINTS_PER_MEDIA, POINTS_PER_MESSAGE, POINTS_LIMIT_TIME, POINTS_LIMIT } from '../config/config.js';
import { POINTS_PER_MESSAGE_ALLOWED_CHANNELS } from '../config/config.js';
import { queryWithReconnect } from './conection.js';


const userService = new User(queryWithReconnect);

// Estructura: { [nickname]: [{ timestamp, points }] }
const userPointsLog = new Map();

export async function handlePointsPerMessage(message) {
  if (message.author.bot) return;

  if (!POINTS_PER_MESSAGE_ALLOWED_CHANNELS.includes(message.channel.id)) return;

  const discordId = message.author.username;
  const nickname = await userService.getNicknameBySocialId('discord', discordId);
  if (!nickname) return;

  const now = Date.now();
  let pointsToAdd = POINTS_PER_MESSAGE;

  if (message.attachments.size > 0) {
    pointsToAdd += POINTS_PER_MEDIA;
  }

  // Obtener historial de puntos de este usuario
  let userLog = userPointsLog.get(nickname) || [];

  // Filtrar solo eventos dentro de la última hora
  userLog = userLog.filter(entry => now - entry.timestamp <= POINTS_LIMIT_TIME);

  const totalPointsLastHour = userLog.reduce((acc, entry) => acc + entry.points, 0);

  if (totalPointsLastHour >= POINTS_LIMIT) {
    console.log(`⚠️ "${nickname}" ya alcanzó el límite de ${POINTS_LIMIT} puntos por hora.`);
    return;
  }

  // Ajustar puntos si está cerca del límite
  if (totalPointsLastHour + pointsToAdd > POINTS_LIMIT) {
    pointsToAdd = POINTS_LIMIT - totalPointsLastHour;
  }

  try {
    await userService.addPoints(nickname, pointsToAdd);
    userLog.push({ timestamp: now, points: pointsToAdd });
    userPointsLog.set(nickname, userLog);

    console.log(`➕ ${pointsToAdd} puntos sumados a "${nickname}" por mensaje`);
  } catch (error) {
    console.error('❌ Error al agregar puntos por mensaje:', error.message);
  }
}
