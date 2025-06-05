import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import sharp from 'sharp';

// Simular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let cachedBackground = null;

// Puedes registrar una fuente personalizada si tienes una
// registerFont(path.join(__dirname, 'fonts', 'YourFont.ttf'), { family: 'YourFont' });

export async function generateTopImage(topUsers) {
    const width = 800;
    const height = 250;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Cargar imagen de fondo
    const background = await getBackgroundImage();
    ctx.drawImage(background, 0, 0, width, height);

    // Estilos de texto
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';

    // Título
    ctx.font = 'bold 32px Arial';
    ctx.fillText('🏆 Top 5 Users', width - 40, 40);

    // Entradas del ranking
    ctx.font = '22px Arial';
    topUsers.forEach((user, index) => {
        const text = `#${index + 1} ${user.nickname} — Lv${user.level} — ${user.points} pts`;
        ctx.fillText(text, width - 60, 80 + index * 30);
    });

    // Guardar imagen
    const outputPath = path.join(__dirname, 'top_result.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
}

export async function generateUserBanner(user) {
    const width = 800;
    const height = 250;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Imagen de fondo igual que la otra función
    try {
        const background = await getBackgroundImageLevel();
        ctx.drawImage(background, 0, 0, width, height);
    } catch (e) {
        console.error('Error cargando imagen de fondo:', e);
    }

    // Círculo avatar
    try {
        console.log('Cargando avatar desde:', user.avatarPath);

        const avatar = await loadDiscordAvatar(user.avatarPath);
        const avatarSize = 100;
        const avatarX = 220;
        const avatarY = height / 2 - avatarSize / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (e) {
        console.error('Error cargando avatar:', e);
    }

    // Texto Rank y Nickname
    try {
        ctx.fillStyle = '#ffffff';
        // Rank
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(user.nickname, 350, 90);


        // Nickname justo debajo
        ctx.font = '22px Arial';
        ctx.fillText(`Rank #${user.rank}`, 350, 120);

        // Círculo con el nivel del usuario
        try {
            const circleX = width - 60;
            const circleY = 90;
            const radius = 22;

            // Círculo dorado
            ctx.beginPath();
            ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#1e1a16'; // dorado
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#2c2620';
            ctx.stroke();

            // Texto del nivel
            ctx.fillStyle = '#d1b06b';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${user.level}`, circleX, circleY);
        } catch (e) {
            console.error('Error dibujando círculo de nivel:', e);
        }

    } catch (e) {
        console.error('Error escribiendo texto:', e);
    }

    try {
        const barX = 350;
        const barY = 160;
        const barWidth = 400;
        const barHeight = 20;
        const maxPoints = 50000;
        const percent = user.pointsToNextLevel
            ? Math.min(user.pointsCurrent / (user.pointsToNextLevel), 1)
            : 1; // Si está en el nivel máximo o falta info, barra completa

        // Fondo oscuro metálico
        const backgroundGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        backgroundGradient.addColorStop(0, '#1e1a16'); // marrón oscuro
        backgroundGradient.addColorStop(1, '#2c2620'); // más claro
        ctx.fillStyle = backgroundGradient;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Contorno dorado
        ctx.strokeStyle = '#bfa76f'; // dorado apagado
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Barra de progreso en tonos dorados/bronce
        const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth * percent, barY);
        progressGradient.addColorStop(0, '#d1b06b'); // dorado claro
        progressGradient.addColorStop(1, '#8c6a3d'); // bronce oscuro
        ctx.fillStyle = progressGradient;
        ctx.fillRect(barX, barY, barWidth * percent, barHeight);

        // Sombra interior suave (opcional para efecto glow dorado)
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffebc6';
        ctx.fillRect(barX, barY, barWidth * percent, barHeight);
        ctx.globalAlpha = 1.0;

        // Texto de puntos
        ctx.fillStyle = '#f6e7c1'; // beige claro
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${user.pointsCurrent} / ${user.pointsToNextLevel} Points`, barX + barWidth - 10, barY + 40);
        ctx.textAlign = 'left';
    } catch (e) {
        console.error('Error dibujando barra de progreso:', e);
    }

    // Guardar imagen
    try {
        const outputPath = path.join(__dirname, `../images/level/user_banner_${user.nickname}.png`);
        fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
        console.log('Banner generado en:', outputPath);
        return outputPath;
    } catch (e) {
        console.error('Error guardando imagen:', e);
        throw e;
    }
}



async function loadDiscordAvatar(url) {
    const response = await fetch(url);
    const buffer = await response.buffer();

    // Convertir a PNG con sharp
    const pngBuffer = await sharp(buffer).png().toBuffer();

    // loadImage acepta un Buffer
    return loadImage(pngBuffer);
}

async function getBackgroundImage() {
    if (!cachedBackground) {
        const backgroundPath = path.join(__dirname, '../images/topbanner.png');
        cachedBackground = await loadImage(backgroundPath);
    }
    return cachedBackground;
}

async function getBackgroundImageLevel() {
    if (!cachedBackground) {
        const backgroundPath = path.join(__dirname, '../images/mylevelbanner.png');
        cachedBackground = await loadImage(backgroundPath);
    }
    return cachedBackground;
}

