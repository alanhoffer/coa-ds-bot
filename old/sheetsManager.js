import { google } from 'googleapis';
import { CONFIG } from '../config/config.js';

const auth = new google.auth.GoogleAuth({
  keyFile: './config/credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

/**
 * Suma Points a un usuario por su nickname o crea una nueva fila si no existe.
 * @param {string} nickname - Nickname del usuario.
 * @param {number} pointsToAdd - Points a sumar.
 */
export async function addPointsByNickname(nickname, pointsToAdd) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener filas con datos
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    // Obtener encabezados (primera fila)
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());

    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const pointsColIndex = headers.findIndex(h => h === "points");

    if (nicknameColIndex === -1 || pointsColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname' y 'Points'");
    }

    let found = false;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nickCell = (row[nicknameColIndex] || "").toLowerCase();

      if (nickCell === nickname.toLowerCase()) {
        const currentPoints = parseInt(row[pointsColIndex]) || 0;
        const newPoints = currentPoints + pointsToAdd;
        const sheetRow = i + 2;

        const targetCell = `${String.fromCharCode(65 + pointsColIndex)}${sheetRow}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId: CONFIG.spreadsheetIdData,
          range: `${CONFIG.sheetNameData}!${targetCell}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[newPoints]],
          },
        });

        console.log(`✅ Se sumaron ${pointsToAdd} Points a "${nickname}". Total ahora: ${newPoints}`);
        found = true;
        break;
      }
    }

    if (!found) {
      const newRow = Array(headers.length).fill("");
      newRow[nicknameColIndex] = nickname;
      newRow[pointsColIndex] = pointsToAdd;

      await sheets.spreadsheets.values.append({
        spreadsheetId: CONFIG.spreadsheetIdData,
        range: `${CONFIG.sheetNameData}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow],
        },
      });

      console.log(`➕ Nueva fila creada para "${nickname}" con ${pointsToAdd} Points`);
    }

  } catch (error) {
    console.error('❌ Error al agregar Points por nickname:', error.message);
  }
}


/**
 * Obtiene el nickname basado en Discord ID, YouTube o Twitch username.
 * @param {string} socialType - "discord", "youtube" o "twitch"
 * @param {string} socialId - Valor del identificador
 * @returns {Promise<string|null>} - Nickname correspondiente o null si no se encuentra
 */
export async function getNicknameBySocialId(socialType, socialId) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener encabezados de la hoja de nicknames
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdNicknames,
      range: `${CONFIG.spreadsheetNameNicknames}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());

    const socialMap = {
      discord: "discord id",
      youtube: "youtube username",
      twitch: "twitch username",
    };

    const socialColName = socialMap[socialType.toLowerCase()];
    if (!socialColName) throw new Error(`Tipo de red social inválido: ${socialType}`);

    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const socialColIndex = headers.findIndex(h => h === socialColName);

    if (nicknameColIndex === -1 || socialColIndex === -1) {
      throw new Error(`Columnas necesarias no encontradas: 'nickname' o '${socialColName}'`);
    }

    // Leer datos
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdNicknames,
      range: `${CONFIG.spreadsheetNameNicknames}!A2:Z`,
    });

    const rows = res.data.values || [];

    for (let row of rows) {
      const cellValue = (row[socialColIndex] || "").toLowerCase();
      if (cellValue === socialId.toLowerCase()) {
        return row[nicknameColIndex] || null;
      }
    }

    return null;

  } catch (error) {
    console.error('❌ Error al obtener nickname por social ID:', error.message);
    return null;
  }
}


export async function getPointsByNickname(nickname) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener filas con datos
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    // Obtener encabezados (primera fila)
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());

    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const pointsColIndex = headers.findIndex(h => h === "points");

    if (nicknameColIndex === -1 || pointsColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname' y 'oints'");
    }

    for (let row of rows) {
      const nickCell = (row[nicknameColIndex] || "").toLowerCase();
      if (nickCell === nickname.toLowerCase()) {
        const currentPoints = parseInt(row[pointsColIndex]) || 0;
        return currentPoints;
      }
    }

    return null; // No se encontró el nickname

  } catch (error) {
    console.error('❌ Error al obtener Points por nickname:', error.message);
    return null;
  }
}

export async function getTop5Nicknames() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener encabezados
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());
    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const pointsColIndex = headers.findIndex(h => h === "points");
    const levelColIndex = headers.findIndex(h => 
      h === "adventurer_level" || h === "first adventurer current level"
    );

    if (nicknameColIndex === -1 || pointsColIndex === -1 || levelColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname', 'Points' y 'Adventurer_Level'");
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    const data = rows
      .map(row => {
        const nickname = row[nicknameColIndex] || 'Desconocido';
        const points = parseInt(row[pointsColIndex]) || 0;
        const level = parseInt(row[levelColIndex]) || 0;
        return { nickname, points, level };
      })
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level; // Primero por nivel descendente
        return b.points - a.points; // Luego por Points descendente
      })
      .slice(0, 5);

    return data;

  } catch (error) {
    console.error('❌ Error al obtener el Top 5:', error.message);
    return [];
  }
}


export async function getUserStatsByNickname(nicknameToFind) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener encabezados
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());
    const nicknameColIndex = headers.findIndex(h => h === 'nickname');
    const pointsColIndex = headers.findIndex(h => h === 'points');
    const levelColIndex = headers.findIndex(h =>
      h === 'adventurer_level' || h === 'first adventurer current level'
    );

    if (nicknameColIndex === -1 || pointsColIndex === -1 || levelColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname', 'Points' y 'Adventurer_Level'");
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    // Mapear todos los usuarios para ranking
    const users = rows.map(row => ({
      nickname: row[nicknameColIndex]?.trim() || 'Desconocido',
      points: parseInt(row[pointsColIndex]) || 0,
      level: parseInt(row[levelColIndex]) || 0,
    }));

    // Ordenar por nivel y luego puntos
    users.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.points - a.points;
    });

    // Buscar usuario y posición
    const lowerNickToFind = nicknameToFind.toLowerCase();
    const rank = users.findIndex(u => u.nickname.toLowerCase() === lowerNickToFind);

    if (rank === -1) return null;

    const user = users[rank];

    // Función para calcular la experiencia requerida para el siguiente nivel
    const levelPointsTable = {
      1: 50000,
      2: 100000,
      3: 200000,
      4: 300000,
      5: 400000,
    };

    return {
      nickname: user.nickname,
      pointsCurrent: user.points,
      pointsToNextLevel: levelPointsTable[user.level  + 1] || 0,
      level: user.level,
      rank: rank + 1,
    };

  } catch (error) {
    console.error('❌ Error al obtener los datos del usuario:', error.message);
    return null;
  }
}


export async function addExpByNickname(nickname, amount) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener filas de datos
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    // Obtener encabezados
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());

    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const expColIndex = headers.findIndex(h => h === "adventurer_exp");
    const levelColIndex = headers.findIndex(h => h === "adventurer_level");

    if (nicknameColIndex === -1 || expColIndex === -1 || levelColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname', 'adventurer_exp' y 'adventurer_level'");
    }

    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const rowNick = (rows[i][nicknameColIndex] || "").toLowerCase();
      if (rowNick === nickname.toLowerCase()) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error("❌ Nickname no encontrado en la hoja.");
    }

    // Valores actuales
    const row = rows[rowIndex];
    let currentExp = parseInt(row[expColIndex] || '0', 10);
    let currentLevel = parseInt(row[levelColIndex] || '1', 10);

    currentExp += amount;

    const expToNextLevel = (level) => 100 + (level - 1) * 50; // puedes ajustar esta fórmula
    let leveledUp = false;

    // Proceso de subida de nivel
    while (currentExp >= expToNextLevel(currentLevel)) {
      currentExp -= expToNextLevel(currentLevel);
      currentLevel++;
      leveledUp = true;
    }

    // Preparar fila actualizada
    rows[rowIndex][expColIndex] = currentExp.toString();
    rows[rowIndex][levelColIndex] = currentLevel.toString();

    // Guardar cambios
    await sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A${rowIndex + 2}:Z${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rows[rowIndex]],
      },
    });

    return leveledUp;

  } catch (error) {
    console.error('❌ Error al agregar experiencia:', error.message);
    return false;
  }
}


export async function getLevelByNickname(nickname) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener filas de datos
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    // Obtener encabezados
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());

    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const levelColIndex = headers.findIndex(h => h === "first adventurer current level");

    if (nicknameColIndex === -1 || levelColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname' y 'First Adventurer Current Level'");
    }

    const userRow = rows.find(row => (row[nicknameColIndex] || "").toLowerCase() === nickname.toLowerCase());

    if (!userRow) {
      throw new Error("Usuario no encontrado");
    }

    const level = parseInt(userRow[levelColIndex] || '1', 10);
    return level;

  } catch (error) {
    console.error('❌ Error al obtener el nivel del usuario:', error.message);
    return null;
  }
}

export async function addLevelByNickname(nickname) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener filas de datos
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A2:Z`,
    });

    const rows = res.data.values || [];

    // Obtener encabezados
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A1:Z1`,
    });

    const headers = headerRes.data.values[0].map(h => h.trim().toLowerCase());

    const nicknameColIndex = headers.findIndex(h => h === "nickname");
    const levelColIndex = headers.findIndex(h => h === "first adventurer current level");

    if (nicknameColIndex === -1 || levelColIndex === -1) {
      throw new Error("Faltan columnas: asegúrate de tener 'Nickname' y 'First Adventurer Current Level'");
    }

    const userRow = rows.find(row => (row[nicknameColIndex] || "").toLowerCase() === nickname.toLowerCase());

    if (!userRow) {
      throw new Error("Usuario no encontrado");
    }

    let currentLevel = parseInt(userRow[levelColIndex] || '1', 10);
    currentLevel++;

    // Actualizar fila
    userRow[levelColIndex] = currentLevel.toString();

    // Guardar cambios
    await sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.spreadsheetIdData,
      range: `${CONFIG.sheetNameData}!A${rows.indexOf(userRow) + 2}:Z${rows.indexOf(userRow) + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [userRow],
      },
    });

    return currentLevel;

  } catch (error) {
    console.error('❌ Error al agregar nivel:', error.message);
    return null;
  }
}
