const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require('express');
const app = express();

// Serveur pour maintenir Render éveillé
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Ayanokoji en ligne'));
app.listen(port, () => console.log(`Serveur actif sur port ${port}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        // Modification ici pour forcer la notification WhatsApp
        browser: ["Ubuntu", "Chrome", "110.0.5481.177"]
    });

    // Demande du code de jumelage
    if (!sock.authState.creds.registered) {
        // --- METS TON NUMÉRO ICI (ex: 243812345678) ---
        const phoneNumber = "243986860268"; 
        
        await delay(8000); // Pause pour laisser le temps au serveur de démarrer
        try {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log("------------------------------------------");
            console.log(`VOTRE CODE DE JUMELAGE : ${code}`);
            console.log("------------------------------------------");
        } catch (error) {
            console.log("Erreur lors de la génération du code :", error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log("✅ BOT CONNECTÉ !");
        if (connection === 'close') {
            console.log("❌ Connexion perdue, tentative de relance...");
            startBot();
        }
    });

    // Commandes de base
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (body.startsWith(prefix)) {
            const cmd = body.slice(prefix.length).trim().split(" ")[0].toLowerCase();
            if (cmd === 'menu') {
                await sock.sendMessage(from, { text: "🏮 *AYANOKOJI-BOT* 🏮\n\n.ping\n.owner\n.runtime" });
            }
            if (cmd === 'ping') await sock.sendMessage(from, { text: "⚡ Pong!" });
        }
    });
}

startBot();

