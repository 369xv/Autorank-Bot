// Bot autorank dev par : ShadowFusion / 1299032601008406538 //
// Re dev par : !*369xv S-X / 1223323670911651862 //

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

const rankRoleId = ''; // Role ID
const keyword = ''; // Tag a avoir dans le pseudo

let streamName = '.gg/gouv-fr';
let streamURL = 'https://twitch.tv/votre_chaine';

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    setStreamingActivity(streamName, streamURL);
});

function setStreamingActivity(name, url) {
    const urlPattern = /^(https?:\/\/(?:www\.)?(twitch\.tv|youtube\.com|facebook\.com)\/[\w-]+)/i;

    if (!urlPattern.test(url)) {
        console.log('URL invalide pour l\'activité STREAMING. Activité non mise à jour.');
        return;
    }

    client.user.setPresence({
        activities: [
            {
                name: name,
                type: ActivityType.Streaming,
                url: url
            }
        ],
        status: 'online'
    });
}

async function sendLogEmbed(guild, title, description, color) {
    const logChannel = guild.channels.cache.get(config.logChannelId);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } else {
        console.log("Canal de logs introuvable !");
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) {
        // Gestion des mentions du bot
        if (message.mentions.has(client.user)) {
            const member = message.guild.members.cache.get(message.author.id);
            const role = message.guild.roles.cache.get(rankRoleId);

            if (member.displayName.includes(keyword)) {
                if (role) {
                    await member.roles.add(role);
                    message.channel.send(`✅ Félicitations ${message.author}, vous avez reçu le rôle **${role.name}** !`);
                    await sendLogEmbed(
                        message.guild,
                        'Rank',
                        `✅ **${message.author.tag}** a été ranke avec le rôle **${role.name}** pour avoir "${keyword}" dans son pseudo.`,
                        0xFF0000
                    );
                } else {
                    message.channel.send(`❌ Le rôle avec l'ID ${rankRoleId} n'existe pas sur ce serveur.`);
                }
            } else {
                message.channel.send(`❌ Désolé ${message.author}, vous devez avoir "${keyword}" dans votre pseudo pour obtenir le rôle.`);
                await sendLogEmbed(
                    message.guild,
                    'Non rank',
                    `❌ **${message.author.tag}** n'a pas été rank car "${keyword}" est absent de son pseudo.`,
                    0xFF0000
                );
            }
        }
        return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setstream') {
        if (args.length < 1) {
            return message.channel.send('❌ Vous devez fournir un nouveau nom pour le stream.');
        }

        streamName = args.join(' ');
        setStreamingActivity(streamName, streamURL);
        message.channel.send(`✅ Le nom du stream a été mis à jour : **${streamName}**`);
    }

    if (command === 'seturl') {
        if (args.length < 1) {
            return message.channel.send('❌ Vous devez fournir une nouvelle URL pour le stream.');
        }

        const newURL = args[0];
        const urlPattern = /^(https?:\/\/(?:www\.)?(twitch\.tv|youtube\.com|facebook\.com)\/[\w-]+)/i;

        if (!urlPattern.test(newURL)) {
            return message.channel.send('❌ L\'URL fournie n\'est pas valide. Veuillez utiliser une URL Twitch, YouTube ou Facebook.');
        }

        streamURL = newURL;
        setStreamingActivity(streamName, streamURL);
        message.channel.send(`✅ L'URL du stream a été mise à jour : **${streamURL}**`);
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const role = newMember.guild.roles.cache.get(rankRoleId);

    if (!newMember.displayName.includes(keyword) && newMember.roles.cache.has(rankRoleId)) {
        await newMember.roles.remove(role);
        console.log(`Le rôle ${role.name} a été retiré de ${newMember.displayName}`);
        await sendLogEmbed(
            newMember.guild,
            'Derank',
            `🔻 **${newMember.displayName}** a été derank et le rôle **${role.name}** a été retiré car "${keyword}" n'est plus dans son pseudo.`,
            0xFF0000
        );
    }
});

client.login(config.token);
