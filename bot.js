require('dotenv').config();
const express = require('express');
const app = express();
const WebSocket = require('ws');
const axios = require('axios');


const port = 3000;
const apiKey = process.env.APIKEY;
const urlWs = "wss://gateway.discord.gg"
const urlHttpPost = `https://discord.com/api/v10/channels/`;

const ws = new WebSocket(urlWs);

ws.onopen = () => {

  console.log('Connexion WebSocket ouverte');

  setInterval(() => {

    let sendWS = {};

    sendWS.op = 1;
    sendWS.d = 2;

    ws.send(JSON.stringify(sendWS));

  },2000);


};

ws.onmessage = (message) => {
  
  let messRecup = JSON.parse(message.data);

  switch (messRecup.op) {

    case 10:
      
      let sendWS = {};

      sendWS.op = 2;
      sendWS.d = {};
      sendWS.d.token = apiKey;
      sendWS.d.intents = 513;
      sendWS.d.properties = {};
      sendWS.d.properties.os = 'windows';
      sendWS.d.properties.browser = 'lib_windev';
      sendWS.d.properties.device = 'lib_windev';

      ws.send(JSON.stringify(sendWS));

      break;

    case 0:

      let channelId = messRecup.d.channel_id;

      if(messRecup.t == "MESSAGE_CREATE" && [process.env.CHANNELIDPENDU,process.env.CHANNELIDQUIZZ].indexOf(channelId) != -1){

        analyseCommande(channelId,messRecup.d.content,messRecup.d.username,messRecup.d.id);

      }


  
    default:
      break;
  };



  /* console.log('Message reçu :', message.data); */
};

ws.onclose = () => {
  console.log('Connexion WebSocket fermée');
};

ws.onerror = (error) => {
  console.error('Erreur WebSocket :', error);
};

function analyseCommande(channelId,texteReception,pseudo,idPseudo){

  if(texteReception[0] == '!'){

    switch (texteReception.substr(1).toUpperCase()) {
      case "START":
      case "RUN":
      case "S":
        repondre(channelId,'ok')
        break;
    
      default:
        break;
    }

  }

}

function repondre(channelId,message){
  
  const msgSend = {
    content: message
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bot ${process.env.APIKEY}`
  };

  axios.post(urlHttpPost + `${channelId}/messages`, msgSend, {headers})
  .then(response => {
    console.log('Réponse du serveur:', response.data);
  })
  .catch(error => {
    console.error('Erreur lors de la requête:', error.message);
  });
}

app.get('/', (req, res) => {
  res.send(`Bot lancé!`)
});

app.listen(port, () => {
  console.log(`Le bot est lancé sur le port ${port}`)
});