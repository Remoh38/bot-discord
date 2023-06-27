const Player = require('./player');
const fs = require('fs');
var deburr = require('lodash.deburr');

class Pendu{
  constructor(channelId){
    this.channelId = channelId;
    this.repondreChannel = {};
    this.listePlayer = [];

    this.motAChercher = '';
    this.motEtoile = '';

    this.idTImeOutFinPartie = null;
    this.dureeInnactivite = 30000;

    this.partieStart = false;

    this.commandeGame = `**liste des commandes: (PENDU)**
\`\`\`
!?, !help commande du jeu
!start lancement d'une nouvelle partie
!join rejoindre le jeu
!quit quitter le jeu
!r, !l,!lettre proposition de lettre
!stats stats en cours du jeu
!players liste des joueurs actuellement dans la partie avec les scores
!regle règle du jeu et points
\`\`\`
    `
  }

  init(funcRepondre){
    this.repondreChannel = funcRepondre;
    //this.repondre('**PENDU** initalisé !');

  }

  commande(pseudo,idPseudo,command,attribut,option1,option2){

    if(this.inGame()){
      clearTimeout(this.idTImeOutFinPartie);
      this.idTImeOutFinPartie = setTimeout(() => {
        this.finPartie()
      },this.dureeInnactivite);
    }

    switch (command) {
      case 'join':
        
        if(!this.isInGame(idPseudo)){

          this.listePlayer.push(new Player(idPseudo,pseudo));

          this.repondre(`**${pseudo}** vient de rejoindre la partie !`);

        } else {

          this.repondre(`**${pseudo}** action impossible! , vous êtes déjà dans la partie !`);

        }

        break;

      case 'quit':
          
        if(this.isInGame(idPseudo)){

          this.listePlayer.splice(this.listePlayer.findIndex(player => player.getId() == idPseudo),1);

          this.repondre(`**${pseudo}** vient de quitter la partie !`);

        } else {

          this.repondre(`**${pseudo}** action impossible! , vous n'êtes pas dans la partie !`);

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

      case 'r':
      case 'l':
      case 'lettre':

        this.repondre(command);

    }

  }

  isInGame(idPseudo){

    return this.listePlayer.findIndex(player => player.getId() == idPseudo) >= 0;


  }

  recupListePlayer(){

    return this.listePlayer.length == 0 ? `Aucun joueur actuellement` : `**liste des joueurs dans la partie:**
    ${
      this.listePlayer.sort((a,b) => a.point - b.point).map(player =>  "-" + player.getName() + "- " + player.getPoint() + " pt(s)")
    }
    `     

  }

  inGame(){return this.partieStart}

  nouvellePartie(){

    this.partieStart = true;
    this.tirerMot();
    this.repondre(`lancement d'une nouvelle partie`);

  }

  finPartie(){
    this.repondre('fin de partie');
    this.razScore();
  }

  tirerMot(){

    fs.readFile('./jeux/pendu/mots.csv', 'utf8', (err, data) => {
      if (err) {
        console.error('Une erreur s\'est produite lors de la lecture du fichier :', err);
        return;
      }
    
      let tabMot = data.split('\r\n');
      let indRand = parseInt(Math.random() * tabMot.length);

      this.motAChercher = deburr(tabMot[indRand]).toUpperCase();
      this.motEtoile = '';
      this.motEtoile = ''.padEnd(this.motAChercher.length,'*');

      this.repondre(this.getMotEtoile())

    });

  }

  getMotEtoile(){

    return  '```' + this.motEtoile + '```';

  }

  joue(lettre){
    let trouve = false;

    this.motAChercher.forEach((l,i) => {
      if(this.motEtoile[i] == '*' && l == lettre.toUpperCase()){
        
        this.motEtoile[i] == lettre.toUpperCase();
        trouve = true

      }
    })

    return trouve;
  }

  razScore(){

    this.listePlayer.forEach(player => player.point = 0);

  }

  repondre(message){
    this.repondreChannel(this.channelId, message);
  }

}

module.exports = Pendu;