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

    async getSupporterTier(nickname, socialType) {
        const socialColumnsMap = {
            patreon: 'patreonTier',
            boosty: 'BoostyTier',
        };
        const columnName = socialColumnsMap[socialType.toLowerCase()];
        if (!columnName) {
            throw new Error(`Tipo de red social inválido: ${socialType}`);
        }
        try {
            const query = `
            SELECT ${columnName}
            FROM reigdnqu_clashofadventurers.firstadventurers
            WHERE nickname = ?
            LIMIT 1
        `;
            const [rows] = await this.queryExecutor(query, [nickname]);
            if (rows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }
            return rows[0][columnName];
        } catch (error) {
            console.error('❌ Error al obtener el tier de apoyo:', error.message);
            return null;
        } finally {
        }
    }

    // Metodo para cambiar el numero de patreon y boosty del usuario en reigdnqu_clashofadventurers.firstadventurers campo patreon_ patreonTier tinyint UNSIGNED NOT NULL,  BoostyTier tinyint UNSIGNED NOT NULL,
    async updateSupporterTier(nickname, socialType, tier) {
        const socialColumnsMap = {
            patreon: 'patreonTier',
            boosty: 'BoostyTier',
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
        if (typeof pointsToAdd !== 'number' || !Number.isInteger(pointsToAdd) || pointsToAdd < 0) {
            throw new TypeError('pointsToAdd debe ser un número entero positivo');
        }

        try {
            console.log(`🔍 Buscando usuario: ${nickname}`);

            // Buscar al usuario
            const [userRows] = await this.queryExecutor(
                'SELECT points, level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );

            let currentPoints = 0;
            let currentLevel = 0;

            if (userRows.length === 0) {
                console.log('👤 Usuario nuevo, inicializando valores');
                currentPoints = pointsToAdd;
                currentLevel = 0;
            } else {
                currentPoints = userRows[0].points || 0;
                currentLevel = userRows[0].level || 0;
                console.log(`🎮 Usuario actual - Nivel: ${currentLevel}, Puntos: ${currentPoints}`);
                currentPoints += pointsToAdd;
            }

            console.log(`➕ Sumando puntos: ${pointsToAdd}, Total puntos ahora: ${currentPoints}`);

            let leveledUp = false;

            while (true) {
                // Obtener puntos necesarios para subir al siguiente nivel
                const [nextLevelReqRows] = await this.queryExecutor(
                    'SELECT required_points FROM reigdnqu_clashofadventurers.levels WHERE level = ?',
                    [currentLevel + 1]
                );

                if (nextLevelReqRows.length === 0) {
                    console.log('🚫 No hay siguiente nivel, terminando bucle de subida');
                    break;
                }

                const requiredForNextLevel = nextLevelReqRows[0].required_points;
                console.log(`🔜 Requisito para subir del nivel ${currentLevel} al ${currentLevel + 1}: ${requiredForNextLevel} puntos`);

                if (currentPoints >= requiredForNextLevel) {
                    currentPoints -= requiredForNextLevel;
                    currentLevel += 1;
                    leveledUp = true;
                    console.log(`⬆️  ¡Subió a nivel ${currentLevel}! Puntos restantes: ${currentPoints}`);
                } else {
                    console.log('🔻 No hay puntos suficientes para subir de nivel');
                    break;
                }
            }

            // Guardar o actualizar usuario
            if (userRows.length === 0) {
                console.log(`🆕 Insertando nuevo usuario: ${nickname} con nivel ${currentLevel} y puntos ${currentPoints}`);
                await this.queryExecutor(
                    'INSERT INTO reigdnqu_clashofadventurers.firstadventurers (nickname, points, level) VALUES (?, ?, ?)',
                    [nickname, currentPoints, currentLevel]
                );
            } else {
                console.log(`💾 Actualizando usuario: ${nickname} a nivel ${currentLevel} con puntos ${currentPoints}`);
                await this.queryExecutor(
                    'UPDATE reigdnqu_clashofadventurers.firstadventurers SET points = ?, level = ? WHERE nickname = ?',
                    [currentPoints, currentLevel, nickname]
                );
            }

            // Calcular puntos restantes para siguiente nivel
            const [nextLevelRows] = await this.queryExecutor(
                'SELECT required_points FROM reigdnqu_clashofadventurers.levels WHERE level = ?',
                [currentLevel + 1]
            );

            let pointsToNextLevel = 0;
            if (nextLevelRows.length > 0) {
                pointsToNextLevel = nextLevelRows[0].required_points - currentPoints;
                if (pointsToNextLevel < 0) pointsToNextLevel = 0;
            }

            console.log(`📊 Resultado final para ${nickname} - Nivel: ${currentLevel}, Puntos en nivel: ${currentPoints}, Puntos para siguiente nivel: ${pointsToNextLevel}`);

            return {
                leveledUp,
                currentLevel,
                currentPoints,
                pointsToNextLevel,
            };

        } catch (error) {
            console.error('❌ Error en addPoints:', error.message);
            return null;
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
        try {
            // 1) Obtener todos los usuarios ordenados por level DESC, points DESC
            const [rows] = await this.queryExecutor(`
            SELECT nickname, points, level
            FROM reigdnqu_clashofadventurers.firstadventurers
            ORDER BY level DESC, points DESC
        `);

            const lowerNick = nicknameToFind.toLowerCase();
            const users = rows.map(row => ({
                nickname: row.nickname,
                points: row.points || 0,
                level: row.level || 0,
            }));

            const rank = users.findIndex(u => u.nickname.toLowerCase() === lowerNick);
            if (rank === -1) return null;

            const user = users[rank];

            // 2) Obtener puntos requeridos para el siguiente nivel desde tabla de niveles
            const [[nextLevelRow]] = await this.queryExecutor(
                'SELECT required_points FROM reigdnqu_clashofadventurers.levels WHERE level = ?',
                [user.level + 1]
            );

            let pointsToNextLevel = null;
            if (nextLevelRow) {
                pointsToNextLevel = nextLevelRow.required_points;
                if (pointsToNextLevel < 0) pointsToNextLevel = 0;
            }

            return {
                nickname: user.nickname,
                pointsCurrent: user.points,
                pointsToNextLevel: pointsToNextLevel,
                level: user.level,
                rank: rank + 1,
            };
        } catch (error) {
            console.error('❌ Error al obtener los datos del usuario:', error.message);
            return null;
        } finally {
            console.log('finally');
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

    async setUserLevel(nickname, newLevel) {
        if (typeof newLevel !== 'number' || !Number.isInteger(newLevel) || newLevel < 0) {
            throw new TypeError('newLevel debe ser un número entero positivo');
        }

        try {
            // Verificar si el usuario existe
            const [userRows] = await this.queryExecutor(
                'SELECT level FROM reigdnqu_clashofadventurers.firstadventurers WHERE nickname = ? LIMIT 1',
                [nickname]
            );
            if (userRows.length === 0) {
                throw new Error(`Usuario ${nickname} no encontrado.`);
            }

            // Actualizar el nivel directamente
            await this.queryExecutor(
                'UPDATE reigdnqu_clashofadventurers.firstadventurers SET level = ? WHERE nickname = ?',
                [newLevel, nickname]
            );

            return newLevel;
        } catch (error) {
            console.error('❌ Error en setUserLevel:', error.message);
            return null;
        } finally {
            console.log('finally');
        }
    }




}

export default User;
