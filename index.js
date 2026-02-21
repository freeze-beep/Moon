const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const config = require("./config");

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('session_data');
    
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["Ayanokoji", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log("✅ BOT AYANOKOJI EN LIGNE !");
        }
        if (connection === 'close') {
            console.log("❌ Connexion perdue, tentative de reconnexion...");
            startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body.startsWith(config.PREFIX)) {
            const cmd = body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase();
            
            if (cmd === "ping") {
                await sock.sendMessage(from, { text: "Le système est opérationnel. ⚡" });
            }
        }
    });
}

startBot();
