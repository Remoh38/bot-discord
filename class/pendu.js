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

  async commande(pseudo,idPseudo,command,attribut,option1,option2){

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

          this.nouvellePartie(true);

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
        
        if(!(attribut.length == 1))
          return;

        if(!this.inGame()){

          this.repondre(`**${pseudo}** action impossible! , le jeu n'est pas lancé (!start) !`)
          return ;
        }

        if(!this.isInGame(idPseudo)){
        
          this.repondre(`**${pseudo}** action impossible! , vous n'êtes pas dans la partie (!join)!`)

        } else {

          let indPlayer = this.listePlayer.findIndex(player => player.getId() == idPseudo);

          if(this.joue(attribut)){

            if(this.controleGagne()){

              this.listePlayer[indPlayer].point += 5;	
              await this.repondre(`**FELICITATION ${pseudo}!**\nle mot était: ${this.getMotEtoile()}\n**CLASSEMENT PENDU**\n${this.recupListePlayer()}`);
                            
              await this.nouvellePartie(false);

            } else {

              this.listePlayer[indPlayer].point ++;
              await this.repondre(`**BRAVO ${pseudo}!**\nmot à trouver: ${this.getMotEtoile()}`);

            }

          } else {

            this.listePlayer[indPlayer].point = this.listePlayer[indPlayer].point > 0 ? this.listePlayer[indPlayer].point - 1 : 0; 
            await this.repondre(`**PERDU ${pseudo}!**\nmot à trouver: ${this.getMotEtoile()}`);

          }

        }

        

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

  async nouvellePartie(start) {
    if(start){
      this.partieStart = true;
      await this.razScore();
      await this.repondre(`Lancement d'une nouvelle partie\nRéinitialisation des scores !\n${this.recupListePlayer()}`);
    }
    
    const mot = await this.tirerMot();
    this.motAChercher = deburr(mot).toUpperCase();
    this.motEtoile = ''.padEnd(this.motAChercher.length, '*');
    await this.repondre(`**------NOUVEAU MOT------**\nMot à trouver : ${this.getMotEtoile()}`);
 }

  finPartie(){
    this.partieStart = false;
    this.repondre('fin de partie');
  }

  tirerMot(){

    return new Promise(resolve => {

      fs.readFile('./jeux/pendu/mots.csv', 'utf8', (err, data) => {
        
        if (err) {
          console.error(`Une erreur s'est produite lors de la lecture du fichier :`, err);
          return;
        }

        let tabMot = data.split('\n');
        let indRand = parseInt(Math.random() * tabMot.length);

        resolve(tabMot[indRand]);
        
      });

    })

  }

  getMotEtoile(){

    return  '```' + this.motEtoile + '```';

  }

  joue(lettre){

    let trouve = false;

    this.motAChercher.split('').forEach((l,i) => {
      if(this.motEtoile[i] == '*' && l == lettre.toUpperCase()){
        
        let charArray = this.motEtoile.split(''); // Conversion en tableau de caractères
        charArray[i] = lettre.toUpperCase(); // Remplacement du deuxième caractère (index 1)
        this.motEtoile = charArray.join(''); // Conversion du tableau en chaîne de caractères
       
        trouve = true

      }
    })

    return trouve;
  }

  controleGagne(){
    return this.motEtoile == this.motAChercher;
  }

  razScore(){
    
    return new Promise(resolve => {
      
      this.listePlayer.forEach((player,i) => {
        player.point = 0;
        if(i == (this.listePlayer.length - 1))
          resolve();
      });

      if(this.listePlayer.length == 0)
        resolve();

    })

  }

  repondre(message){

    return new Promise(resolve => {

      this.repondreChannel(this.channelId, message).then((data) => {
        resolve();
      })

    })
    
    
      
  }

}

module.exports = Pendu;