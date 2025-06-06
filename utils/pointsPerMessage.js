import User from '../entities/User.js';
import {
  POINTS_PER_MEDIA,
  POINTS_PER_MESSAGE,
  POINTS_LIMIT_TIME,
  POINTS_LIMIT,
  POINTS_PER_MESSAGE_ALLOWED_CHANNELS
} from '../config/config.js';
import { queryWithReconnect } from './conection.js';

const userService = new User(queryWithReconnect);
const userPointsLog = new Map(); // { [nickname]: [{ timestamp, points }] }

export async function handlePointsPerMessage(message) {
  console.log(`📥 Mensaje recibido de ${message.author.tag} (${message.author.username}) en canal ${message.channel.id}`);

  // Ignorar bots
  if (message.author.bot) {
    console.log('🤖 Mensaje ignorado: es de un bot.');
    return;
  }

  // Canal no permitido
  if (!POINTS_PER_MESSAGE_ALLOWED_CHANNELS.includes(message.channel.id)) {
    console.log(`⛔ Canal no permitido: ${message.channel.id}`);
    return;
  }

  // Usar Discord ID (único) en vez de username
  const discordId = message.author.username;

  // Obtener nickname vinculado
  const nickname = await userService.getNicknameBySocialId('discord', discordId);
  if (!nickname) {
    console.log(`❌ No se encontró nickname para Discord ID: ${discordId}`);
    return;
  }

  const now = Date.now();
  let pointsToAdd = POINTS_PER_MESSAGE;

  if (message.attachments.size > 0) {
    pointsToAdd += POINTS_PER_MEDIA;
    console.log(`📎 Mensaje tiene adjuntos, puntos extra: ${POINTS_PER_MEDIA}`);
  }

  // Validar configuración
  if (typeof pointsToAdd !== 'number' || typeof POINTS_LIMIT !== 'number') {
    console.error('⚠️ Configuración incorrecta: puntos o límite no son números.');
    return;
  }

  // Obtener historial de puntos
  let userLog = userPointsLog.get(nickname) || [];
  userLog = userLog.filter(entry => now - entry.timestamp <= POINTS_LIMIT_TIME);
  const totalPointsLastHour = userLog.reduce((acc, entry) => acc + entry.points, 0);

  console.log(`📊 Total puntos última hora para "${nickname}": ${totalPointsLastHour}/${POINTS_LIMIT}`);

  // Ya alcanzó el límite
  if (totalPointsLastHour >= POINTS_LIMIT) {
    console.log(`⚠️ "${nickname}" alcanzó el límite de puntos por hora.`);
    return;
  }

  // Ajustar si se pasa del límite
  if (totalPointsLastHour + pointsToAdd > POINTS_LIMIT) {
    pointsToAdd = POINTS_LIMIT - totalPointsLastHour;
    console.log(`🧮 Puntos ajustados a ${pointsToAdd} para no pasar el límite.`);
  }

  try {
    await userService.addPoints(nickname, pointsToAdd);
    userLog.push({ timestamp: now, points: pointsToAdd });
    userPointsLog.set(nickname, userLog);

    console.log(`✅ ${pointsToAdd} puntos sumados a "${nickname}"`);
  } catch (error) {
    console.error('❌ Error al agregar puntos:', error);
  }
}
