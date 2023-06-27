const Player = require('./player');

class Quizz{
  constructor(channelId,funcRepondre){
    this.channelId = channelId;
    this.repondreChannel = {};
    this.listePlayer = [];

    this.idTImeOutFinPartie = null;
    this.dureeInnactivite = 30000;

    this.partieStart = false;

    this.commandeGame = `**liste des commandes: (QUIZZ)**
\`\`\`
!?, !help commande du jeu
!join rejoindre le jeu
!start lancement d'une nouvelle partie
!quit quitter le jeu
!r,!reponse proposition de réponse
!stats stats en cours du jeu
!players liste des joueurs actuellement dans la partie avec les scores
!regle règle du jeu et points
\`\`\`
    `
  }

  init(funcRepondre){
    this.repondreChannel = funcRepondre;
    //this.repondre('**QUIZZ** initalisé !');
  }

  commande(pseudo,idPseudo,command,attribut,option1,option2){
    
    if(this.inGame()){
      clearTimeout(this.idTImeOutFinPartie);
      this.idTImeOutFinPartie = setTimeout(() => {
        this.repondre('fin de partie');
        this.razScore();
      },this.dureeInnactivite);
    }
    switch (command) {
      case 'join':

        if(!this.isInGame(idPseudo)){

          this.listePlayer.push(new Player(idPseudo,pseudo));

          this.repondre(`**${pseudo}** vient de rejoindre le jeu !`);

        } else {

          this.repondre(`**${pseudo}** action impossible! , vous êtes déjà dans le jeu !`);

        }

        break;

      case 'quit':
          
        if(this.isInGame(idPseudo)){

          this.listePlayer.splice(this.listePlayer.findIndex(player => player.getId() == idPseudo),1);

          this.repondre(`**${pseudo}** vient de quitter le jeu !`);

        } else {

          this.repondre(`**${pseudo}** action impossible! , vous n'êtes pas dans le jeu !`);

        }
        
        break;

      case 'start':

        if(!this.inGame()){

          this.nouvellePartie();

          clearTimeout(this.idTImeOutFinPartie);
          this.idTImeOutFinPartie = setTimeout(() => {
            this.finPartie()
          },this.dureeInnactivite);

        } else {

          this.repondre(`La partie est déjà lancée !`)

        }

        break;

      case '?':
      case 'help':

        this.repondre(this.commandeGame);

        break;

      case 'player':
      case 'players':

        this.repondre(this.recupListePlayer())

        break;

      default:

        this.repondre(command);

        break;
    }

  }

  isInGame(idPseudo){

    return this.listePlayer.findIndex(player => player.getId() == idPseudo) >= 0;

  }

  recupListePlayer(){

    return this.listePlayer.length == 0 ? `Aucun joueur actuellement` : `**liste des joueurs dans le jeu:**
    ${
      this.listePlayer.sort((a,b) => a.point - b.point).map(player =>  "-" + player.getName() + "- " + player.getPoint() + " pt(s)")
    }
    `     

  }

  inGame(){return this.partieStart}

  nouvellePartie(){

    this.partieStart = true;
    this.repondre(`lancement d'une nouvelle partie`);

  }

  finPartie(){
    this.repondre('fin de partie');
    this.razScore();
  }

  razScore(){

    this.listePlayer.forEach(player => player.point = 0);

  }

  repondre(message){
    this.repondreChannel(this.channelId, message);
  }

}

module.exports = Quizz;