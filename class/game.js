const Pendu = require('./pendu');
const Quizz = require('./quizz');

class Game{

  constructor(funcRepondre){

    this.init = false;
    this.pendu = new Pendu(process.env.CHANNELIDPENDU);
    this.quizz = new Quizz(process.env.CHANNELIDQUIZZ);
    this.repondreChannel = funcRepondre;

  }

  initialisation(){

    this.pendu.init(this.repondreChannel);
    this.quizz.init(this.repondreChannel);

    this.init = true;

  }

  analyseCommande(channelId,texteReception,pseudo,idPseudo){
    
    const command = texteReception.length > 0 ? texteReception.shift().toLowerCase() : '';
    const attribut = texteReception.length > 0 ? texteReception.shift().toLowerCase() : '';
    const option1 = texteReception.length > 0 ? texteReception.shift().toLowerCase() : '';
    const option2 = texteReception.length > 0 ? texteReception.shift().toLowerCase() : '';

    switch (channelId) {
      case process.env.CHANNELIDPENDU:
        
        this.pendu.commande(pseudo,idPseudo,command,attribut,option1,option2);

        break;
      
      case process.env.CHANNELIDQUIZZ:
        
        this.quizz.commande(pseudo,idPseudo,command,attribut,option1,option2);

        break;
    
      default:
        break;

    }

  }

  /* if(texteReception[0] == '!'){

    switch (texteReception.substr(1).toUpperCase()) {

      

        
    
      default:
        break;
    }

  } */

  

  isInit(){
    return this.init;
  }

  repondre(idChannel,message){
    this.repondreChannel(idChannel,message)
  }

}

module.exports = Game;