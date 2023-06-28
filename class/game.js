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
    const reponseComplete = texteReception.length > 0 ? texteReception.join(' ').toLowerCase() : '';

    switch (channelId) {
      case process.env.CHANNELIDPENDU:
        
        this.pendu.commande(pseudo,idPseudo,command,attribut,reponseComplete);

        break;
      
      case process.env.CHANNELIDQUIZZ:
        
        this.quizz.commande(pseudo,idPseudo,command,attribut,reponseComplete);

        break;
    
      default:
        break;

    }

  }  

  isInit(){
    return this.init;
  }

}

module.exports = Game;