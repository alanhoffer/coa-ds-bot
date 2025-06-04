import mysql from 'mysql2/promise';
import { Client } from 'ssh2';
import { MYSQL_CONFIG, SSH_CONFIG } from '../config/config.js';

let sshClient = null;
let pool = null;

async function createTunnelAndPool() {
  return new Promise((resolve, reject) => {
    sshClient = new Client();

    sshClient.on('ready', () => {
      sshClient.forwardOut(
        '127.0.0.1',
        12345,
        MYSQL_CONFIG.host,
        MYSQL_CONFIG.port,
        (err, stream) => {
          if (err) {
            sshClient.end();
            return reject(err);
          }

          pool = mysql.createPool({
            ...MYSQL_CONFIG,
            stream,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
          });

          resolve(pool);
        }
      );
    });

    sshClient.on('error', (err) => {
      console.error('[SSH] Error en cliente:', err);
      reject(err);
    });

    sshClient.connect(SSH_CONFIG);
  });
}

async function getPool() {
  if (!pool) {
    try {
      await createTunnelAndPool();
    } catch (error) {
      throw new Error('No se pudo crear pool y túnel: ' + error.message);
    }
  }
  return pool;
}

// Detectar errores de conexión y reiniciar pool y sshClient
function handleDisconnect() {
  if (pool) {
    pool.end(); // cerrar pool mysql
    pool = null;
  }
  if (sshClient) {
    sshClient.end();
    sshClient = null;
  }
}

async function queryWithReconnect(query, params) {
  try {
    const connectionPool = await getPool();
    return await connectionPool.query(query, params);
  } catch (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      console.warn('Conexión perdida, intentando reconectar...');
      handleDisconnect();
      // Reintentar 1 vez después de desconectar
      const connectionPool = await getPool();
      return connectionPool.query(query, params);
    }
    throw err;
  }
}

export {
  getPool,
  queryWithReconnect,
  handleDisconnect,
};
