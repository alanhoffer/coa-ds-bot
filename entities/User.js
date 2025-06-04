import mysql from 'mysql2/promise';

class User {
    constructor(queryExecutor) {
        this.queryExecutor = queryExecutor;
    }

    _validatePoints(pointsToAdd) {
        if (typeof pointsToAdd !== 'number' || !Number.isInteger(pointsToAdd)) {
            throw new TypeError('pointsToAdd debe ser un número entero');
        }
    }

    async getNicknameBySocialId(socialType, socialId) {
        const socialColumnsMap = {
            discord: 'discord_username',
            youtube: 'youtube_username',
            twitch: 'twitch_username',
            instagram: 'instagram_username',
            tiktok: 'tiktok_username',
            telegram: 'telegram_username',
            bluesky: 'bluesky_username',
            patreon: 'patreon_username',
            boosty: 'boosty_username',
            vk: 'vk_username',
        };

        const columnName = socialColumnsMap[socialType.toLowerCase()];
        if (!columnName) {
            throw new Error(`Tipo de red social inválido: ${socialType}`);
        }

        try {
            const query = `
            SELECT nickname
            FROM reigdnqu_clashofadventurers.user_socials
            WHERE LOWER(${columnName}) = LOWER(?)
            LIMIT 1
        `;
            const [rows] = await this.queryExecutor(query, [socialId]);

            // Si no hay resultados, devolver null
            if (!rows || rows.length === 0) {
                return null;
            }

            return rows[0].nickname;
        } catch (error) {
            console.error('Error al obtener nickname:', error.message);
            throw error; // O podrías retornar null si prefieres que no rompa
        } finally {
        }
    }

    // Metodo para cambiar el numero de patreon y boosty del usuario en reigdnqu_clashofadventurers.firstadventurers campo patreon_ patreonTier tinyint UNSIGNED NOT NULL,  BoostyTier tinyint UNSIGNED NOT NULL,
    async updateSupporterTier(nickname, socialType, tier) {
        const socialColumnsMap = {
            patreon: 'patreon_tier',
            boosty: 'boosty_tier',
        };

        const columnName = socialColumnsMap[socialType.toLowerCase()];
        if (!columnName) {
            throw new Error(`Tipo de red social inválido: ${socialType}`);
        }

        if (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 0) {
            throw new TypeError('tier debe ser un número entero positivo');
        }

        try {
            const query = `
            UPDATE reigdnqu_clashofadventurers.firstadventurers
            SET ${columnName} = ?
            WHERE nickname = ?
        `;
            const [result] = await this.queryExecutor(query, [tier, nickname]);

            if (result.affectedRows === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }

            return true; // O podrías retornar el nuevo valor del tier si prefieres
        } catch (error) {
            console.error('Error al actualizar el tier:', error.message);
            throw error; // O podrías retornar false si prefieres que no rompa
        } finally {
        }
    }


    async addPoints(nickname, pointsToAdd) {
        this._validatePoints(pointsToAdd);
        const conn = 1
        try {
            const [result] = await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET points = points + ? WHERE nickname = ?',
                [pointsToAdd, nickname]
            );
            if (result.affectedRows === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }

            const [rows] = await this.queryExecutor('SELECT points FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ?', [nickname]);
            return rows[0].points;
        } finally {
            console.log('finally')
        }
    }
    async removePoints(nickname, pointsToRemove) {
        this._validatePoints(pointsToRemove);
        const conn = 1
        try {
            const [result] = await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET points = GREATEST(points - ?, 0) WHERE nickname = ?',
                [pointsToRemove, nickname]
            );
            if (result.affectedRows === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }

            const [rows] = await this.queryExecutor('SELECT points FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ?', [nickname]);
            return rows[0].points;
        } finally {
            console.log('finally')
        }
    }

    async getPoints(nickname) {
        const conn = 1
        try {
            const query = `
      SELECT points
      FROM reigdnqu_clashofadventurers.firstadventurers
      WHERE nickname = ?
      LIMIT 1
    `;
            const [rows] = await this.queryExecutor(query, [nickname]);
            if (rows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return rows[0].points;
        } catch (error) {
            console.error('❌ Error al obtener puntos:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }

    async setPoints(nickname, newPoints) {
        if (typeof newPoints !== 'number' || !Number.isInteger(newPoints)) {
            throw new TypeError('newPoints debe ser un número entero');
        }

        const conn = 1
        try {
            const [result] = await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET points = ? WHERE nickname = ?',
                [newPoints, nickname]
            );
            if (result.affectedRows === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return newPoints;
        } catch (error) {
            console.error('❌ Error al establecer puntos:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }

    async getTopUsers(limit = 5) {
        const conn = 1
        try {
            const query = `
      SELECT nickname, points, level
      FROM reigdnqu_clashofadventurers.firstadventurers
      ORDER BY level DESC, points DESC
      LIMIT ?
    `;
            const [rows] = await this.queryExecutor(query, [limit]);
            return rows.map(row => ({
                nickname: row.nickname || 'Desconocido',
                points: row.points || 0,
                level: row.level || 0,
            }));
        } catch (error) {
            console.error('❌ Error al obtener el Top:', error.message);
            return [];
        } finally {
            console.log('finally')
        }
    }

    async getUserStatsByNickname(nicknameToFind) {
        const conn = 1
        try {
            // 1) Obtener todos los usuarios ordenados por level DESC, experience DESC
            const [rows] = await this.queryExecutor(`
            SELECT nickname, experience, level
            FROM reigdnqu_clashofadventurers.firstadventurers
            ORDER BY level DESC, experience DESC
        `);

            const lowerNick = nicknameToFind.toLowerCase();
            const users = rows.map(row => ({
                nickname: row.nickname,
                exp: row.experience || 0,
                level: row.level || 0,
            }));

            const rank = users.findIndex(u => u.nickname.toLowerCase() === lowerNick);
            if (rank === -1) return null;

            const user = users[rank];

            // 2) Obtener experiencia requerida para el siguiente nivel desde tabla reigdnqu_clashofadventurers.levels
            const [[nextLevelRow]] = await this.queryExecutor(
                'SELECT exp_required FROM reigdnqu_clashofadventurers.levels WHERE level = ?',
                [user.level + 1]
            );

            return {
                nickname: user.nickname,
                expCurrent: user.exp,
                expToNextLevel: nextLevelRow.exp_required,  // puede ser null si está en el nivel máximo
                level: user.level,
                rank: rank + 1,
            };
        } catch (error) {
            console.error('❌ Error al obtener los datos del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }


    async addExpByNickname(nickname, amount) {
        if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) {
            throw new TypeError('amount debe ser un número entero positivo');
        }

        const conn = 1
        try {
            // 1) Obtener experiencia y nivel actuales del usuario
            const [rows] = await this.queryExecutor(
                'SELECT experience, level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );

            if (rows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }

            let currentExp = rows[0].experience || 0;
            let currentLevel = rows[0].level || 1;

            currentExp += amount;

            // Función para calcular experiencia para subir nivel
            const expToNextLevel = (level) => 100 + (level - 1) * 50;

            let leveledUp = false;

            // 2) Ciclo para subir niveles mientras haya experiencia suficiente
            while (currentExp >= expToNextLevel(currentLevel)) {
                currentExp -= expToNextLevel(currentLevel);
                currentLevel++;
                leveledUp = true;
            }

            // 3) Actualizar en DB
            await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET experience = ?, level = ? WHERE nickname = ?',
                [currentExp, currentLevel, nickname]
            );

            return leveledUp;
        } catch (error) {
            console.error('❌ Error al agregar experiencia:', error.message);
            return false;
        } finally {
            console.log('finally')
        }
    }

    async updateUserLevel(nickname) {
        const conn = 1
        try {
            const [userRows] = await this.queryExecutor(
                `SELECT experience, level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ?`,
                [nickname]
            );
            if (userRows.length === 0) throw new Error('Usuario no encontrado');

            const { experience: totalExp, level: currentLevel } = userRows[0];

            const [levelRows] = await this.queryExecutor(
                `SELECT level FROM reigdnqu_clashofadventurers.levels WHERE exp_required <= ? ORDER BY exp_required DESC LIMIT 1`,
                [totalExp]
            );
            if (levelRows.length === 0) throw new Error('No se encontró nivel para esta experiencia');

            const newLevel = levelRows[0].level;

            if (newLevel !== currentLevel) {
                await this.queryExecutor(
                    `UPDATE reigdnqu_clashofadventurers.firstadventurers SET level = ? WHERE nickname = ?`,
                    [newLevel, nickname]
                );
            }

            return newLevel;
        } catch (error) {
            console.error('❌ Error al actualizar el nivel del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }

    async getUserLevel(nickname) {
        const conn = 1
        try {
            const [rows] = await this.queryExecutor(
                'SELECT level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );
            if (rows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return rows[0].level;
        } catch (error) {
            console.error('❌ Error al obtener el nivel del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }

    async setUserLevel(nickname, newLevel) {
        if (typeof newLevel !== 'number' || !Number.isInteger(newLevel) || newLevel < 1) {
            throw new TypeError('newLevel debe ser un número entero positivo');
        }

        const conn = 1
        try {
            const [result] = await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET level = ? WHERE nickname = ?',
                [newLevel, nickname]
            );
            if (result.affectedRows === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return newLevel;
        } catch (error) {
            console.error('❌ Error al establecer el nivel del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }

    async addUserLevel(nickname, levelToAdd) {
        if (typeof levelToAdd !== 'number' || !Number.isInteger(levelToAdd) || levelToAdd < 0) {
            throw new TypeError('levelToAdd debe ser un número entero positivo');
        }

        const conn = 1
        try {
            // Obtener nivel actual
            const [userRows] = await this.queryExecutor(
                'SELECT level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );
            if (userRows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            let currentLevel = userRows[0].level || 1;

            // Sumar nivel
            currentLevel += levelToAdd;

            // Actualizar en tabla users si hay cambios
            await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET level = ? WHERE nickname = ?',
                [currentLevel, nickname]
            );

            return currentLevel;
        } catch (error) {
            console.error('❌ Error en addUserLevel:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }


    async getUserExperience(nickname) {
        const conn = 1
        try {
            const [rows] = await this.queryExecutor(
                'SELECT experience FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );
            if (rows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return rows[0].experience;
        } catch (error) {
            console.error('❌ Error al obtener la experiencia del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }


    async addExp(nickname, expToAdd) {
        if (typeof expToAdd !== 'number' || !Number.isInteger(expToAdd) || expToAdd < 0) {
            throw new TypeError('expToAdd debe ser un número entero positivo');
        }

        const conn = 1
        try {
            // Obtener experiencia y nivel actual
            const [userRows] = await this.queryExecutor(
                'SELECT experience, level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );
            if (userRows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            let currentExp = userRows[0].experience || 0;
            let currentLevel = userRows[0].level || 1;

            // Sumar experiencia
            currentExp += expToAdd;

            // Obtener nivel según experiencia acumulada
            const [levelRows] = await this.queryExecutor(
                'SELECT level FROM reigdnqu_clashofadventurers.levels WHERE exp_required <= ? ORDER BY exp_required DESC LIMIT 1',
                [currentExp]
            );
            if (levelRows.length === 0) {
                throw new Error('No se encontró nivel para esta experiencia.');
            }
            const newLevel = levelRows[0].level;

            // Actualizar en tabla users si hay cambios
            if (newLevel !== currentLevel || currentExp !== userRows[0].experience) {
                await this.queryExecutor(
                    'UPDATE reigdnqu_clashofadventurers.firstadventurers SET experience = ?, level = ? WHERE nickname = ?',
                    [currentExp, newLevel, nickname]
                );
            }

            // Calcular experiencia faltante para siguiente nivel
            const [nextLevelRows] = await this.queryExecutor(
                'SELECT exp_required FROM reigdnqu_clashofadventurers.levels WHERE level = ?',
                [newLevel + 1]
            );

            let expToNextLevel = 0;
            if (nextLevelRows.length > 0) {
                expToNextLevel = nextLevelRows[0].exp_required - currentExp;
                if (expToNextLevel < 0) expToNextLevel = 0;
            }

            return {
                leveledUp: newLevel > currentLevel,
                currentLevel: newLevel,
                currentExp,
                expToNextLevel,
            };
        } catch (error) {
            console.error('❌ Error en addExp:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }


    async setUserExperience(nickname, newExperience) {
        if (typeof newExperience !== 'number' || !Number.isInteger(newExperience) || newExperience < 0) {
            throw new TypeError('newExperience debe ser un número entero positivo');
        }

        const conn = 1
        try {
            const [result] = await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET experience = ? WHERE nickname = ?',
                [newExperience, nickname]
            );
            if (result.affectedRows === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return newExperience;
        } catch (error) {
            console.error('❌ Error al establecer la experiencia del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }


    async getUserRank(nickname) {
        const conn = 1
        try {
            const [rows] = await this.queryExecutor(
                'SELECT rank FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );
            if (rows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return rows[0].rank;
        } catch (error) {
            console.error('❌ Error al obtener el rango del usuario:', error.message);
            return null;
        } finally {
            console.log('finally')
        }
    }

}

export default User;
