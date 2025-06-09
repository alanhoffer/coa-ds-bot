import { CHEST_PRICE } from '../config/config.js';

export default {
    name: "chest",
    description: "Shows information about available chests.",
    run: async ({ message, args, userService }) => {
        // Muestra información sobre los cofres
        const chestInfo = `**Cofres disponibles:**
        \`!openchest\` - Abre un cofre por **${CHEST_PRICE} Points** y recibe una recompensa aleatoria.
        Recompensas posibles:
        \`50 Points (probabilidad 50%)\`
        \`100 Points (probabilidad 30%)\`
        \`500 Points (probabilidad 15%)\`
        \`First Adventurer level (probabilidad 0.5%, cofre misterioso que otorga el primer nivel de aventurero)\``;
        message.channel.send(chestInfo);
    }
};