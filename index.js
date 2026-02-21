
const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, (answer) => { rl.close(); resolve(answer); }));
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // On désactive le QR code
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- LOGIQUE DE JUMELAGE PAR NUMÉRO ---
    if (!sock.authState.creds.registered) {
        // ATTENTION : Remplace le numéro ci-dessous par ton numéro avec l'indicatif (ex: 243...)
        const phoneNumber = "243986860268"; 
        
        await delay(5000); // On attend que Render soit prêt
        let code = await sock.requestPairingCode(phoneNumber);
        console.log("------------------------------------------");
        console.log(`VOTRE CODE DE JUMELAGE EST : ${code}`);
        console.log("------------------------------------------");
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log("✅ BOT CONNECTÉ ET PRÊT !");
        if (connection === 'close') startBot();
    });
}

startBot();
