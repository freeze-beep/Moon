const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require('express');
const app = express();

// --- SYSTÈME ANTI-SOMMEIL POUR RENDER ---
const port = process.env.PORT || 3000;
app.get('/', (res) => res.send('Bot Ayanokoji Actif !'));
app.listen(port, () => console.log(`Serveur de maintien sur le port ${port}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- LOGIQUE DE JUMELAGE (PAIRING) ---
    if (!sock.authState.creds.registered) {
        // REMPLACE LE NUMÉRO CI-DESSOUS (Exemple: 243...)
        const phoneNumber = "243858944656"; 
        
        await delay(5000);
        let code = await sock.requestPairingCode(phoneNumber);
        console.log("------------------------------------------");
        console.log(`VOTRE CODE DE JUMELAGE EST : ${code}`);
        console.log("------------------------------------------");
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log("✅ BOT CONNECTÉ ET PRÊT !");
        }
        if (connection === 'close') {
            console.log("❌ Connexion perdue, reconnexion...");
            startBot();
        }
    });

    // --- SYSTÈME DE COMMANDES (MENU) ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (body.startsWith(prefix)) {
            const cmd = body.slice(prefix.length).trim().split(" ")[0].toLowerCase();

            switch (cmd) {
                case 'menu':
                    const menu = `
╭───〖 *AYANOKOJI-BOT* 〗───
│ 
│ 👋 *Salut ! Voici mes commandes :*
│ 
│ 🛠️ *.ping* : Vitesse du bot
│ 👤 *.owner* : Qui est mon maître ?
│ 📊 *.runtime* : Temps de marche
│ 💡 *.info* : À propos de moi
│ 
╰──────────────────────────`;
                    await sock.sendMessage(from, { text: menu });
                    break;

                case 'ping':
                    await sock.sendMessage(from, { text: "⚡ *Pong !* Je suis ultra rapide." });
                    break;

                case 'owner':
                    await sock.sendMessage(from, { text: "Mon créateur est le grand Ayanokoji." });
                    break;
                
                case 'runtime':
                    const uptime = process.uptime();
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    await sock.sendMessage(from, { text: `📊 Je tourne depuis : ${hours}h ${minutes}m` });
                    break;
            }
        }
    });
}

startBot();

