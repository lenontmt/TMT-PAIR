const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
app.use(express.json());

// HOME PAGE - TMT-XMD V2 PAIR SITE
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head><title>TMT-XMD V2 - Pair Code</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:20px}
    .box{background:#111;border:2px solid #00ff00;border-radius:15px;padding:25px;max-width:400px;margin:auto;margin-top:40px}
    h1{color:#00ff00} input{width:90%;padding:12px;border-radius:8px;border:none;margin:10px 0;font-size:16px}
    button{background:#00ff00;color:#000;padding:12px 25px;border:none;border-radius:8px;font-weight:bold;font-size:16px;cursor:pointer;width:95%}
    #result{margin-top:20px;font-size:22px;font-weight:bold;color:yellow;letter-spacing:3px}
    .copy{background:#fff;color:#000;padding:5px 10px;border-radius:5px;font-size:13px;cursor:pointer}
  </style>
  </head>
  <body>
    <div class="box">
      <h1>🔥 TMT-XMD V2 🔥</h1>
      <p>Pair Code Site By Lenon TMT</p>
      <p>Isa number yako isina + , semuenzaniso 263787400553</p>
      <input id="num" placeholder="263787400553" type="number" />
      <button onclick="getCode()">GET PAIR CODE</button>
      <div id="result"></div>
      <p id="info" style="font-size:13px;color:#aaa"></p>
    </div>
  <script>
    async function getCode(){
      let num = document.getElementById('num').value;
      if(!num) return alert('Isa number yako!');
      document.getElementById('result').innerText = '⏳ Ndichigadzira... mirira 10 seconds...';
      let r = await fetch('/pair?number='+num);
      let d = await r.json();
      if(d.code){
        document.getElementById('result').innerHTML = 'PAIR CODE YAKO:<br><br>'+d.code+'<br><br><button class="copy" onclick="navigator.clipboard.writeText(\''+d.code+'\')">COPY CODE</button>';
        document.getElementById('info').innerText = 'Enda pa WhatsApp > Linked Devices > Link with phone number > Isa code iyi. Session ID ichatumirwa ku WhatsApp yako.';
      } else {
        document.getElementById('result').innerText = 'Error: '+d.error;
      }
    }
  </script>
  </body>
  </html>
  `);
});

// PAIR CODE LOGIC
app.get('/pair', async (req, res) => {
  let num = req.query.number;
  if(!num) return res.json({error:'No number'});
  // Bvisa ma folder ekare
  if(fs.existsSync('./auth')) fs.rmSync('./auth', {recursive:true, force:true});
  try{
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({
      logger: pino({level:'silent'}),
      auth: state,
      browser: Browsers.macOS('Chrome'),
      printQRInTerminal: false
    });
    sock.ev.on('creds.update', saveCreds);
    // Mirira 3 sec
    await new Promise(r=>setTimeout(r,3000));
    let code = await sock.requestPairingCode(num);
    res.json({code: code});

    // Kana yabudirira, tumira SESSION_ID ku user
    sock.ev.on('connection.update', async (u)=>{
      if(u.connection === 'open'){
        let creds = fs.readFileSync('./auth/creds.json','utf-8');
        let sessionId = Buffer.from(creds).toString('base64');
        // Tumira session ku WhatsApp ye user
        await sock.sendMessage(sock.user.id, {text: `*🔥 TMT-XMD V2 SESSION ID 🔥*\n\nTMT-XMD-V2~${sessionId}\n\nCopy izvi uise pa Panel mu SESSION_ID\n\nBy Lenon TMT`});
        await new Promise(r=>setTimeout(r,2000));
        process.exit(0);
      }
    });
  }catch(e){
    res.json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('TMT-PAIR running on '+PORT));
