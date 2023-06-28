const Player = require('./player');
const fs = require('fs');
var deburr = require('lodash.deburr');

class Quizz{
  constructor(channelId,funcRepondre){
    this.channelId = channelId;
    this.repondreChannel = {};
    this.listePlayer = [];

    this.idTImeOutFinPartie = null;
    this.dureeInnactivite = 30000;

    this.partieStart = false;

    this.question = '';
    this.reponse = '';
    this.ReponseEtoile = '';

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

  async commande(pseudo,idPseudo,command,attribut,reponseComplete){
    
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
      case 'reponse':

        /* if(!(attribut.length == 1))
        return; */

        if(!this.inGame()){

          this.repondre(`**${pseudo}** action impossible! , le jeu n'est pas lancé (!start) !`)
          return ;
        }

        if(!this.isInGame(idPseudo)){
        
          this.repondre(`**${pseudo}** action impossible! , vous n'êtes pas dans la partie (!join)!`)

        } else {

          let indPlayer = this.listePlayer.findIndex(player => player.getId() == idPseudo);

          if(this.joue(reponseComplete)){

            if(this.controleGagne()){

              this.listePlayer[indPlayer].point += 5;	
              await this.repondre(`**FELICITATION ${pseudo}!**\nla réponse était: ${this.getReponseEtoile()}\n**CLASSEMENT QUIZZ**\n${this.recupListePlayer()}`);
                            
              await this.nouvellePartie(false);

            } else {

              this.listePlayer[indPlayer].point ++;
              await this.repondre(`**BRAVO ${pseudo}!**\n${this.getQuestion()}\nréponse: ${this.getReponseEtoile()}`);

            }

          } else {

            this.listePlayer[indPlayer].point = this.listePlayer[indPlayer].point > 0 ? this.listePlayer[indPlayer].point - 1 : 0; 
            await this.repondre(`**PERDU ${pseudo}!**\n${this.getQuestion()}\nréponse: ${this.getReponseEtoile()}`);

          }


        }

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

  async nouvellePartie(start){

    if(start){
      this.partieStart = true;
      await this.razScore();
      await this.repondre(`Lancement d'une nouvelle partie\nRéinitialisation des scores !\n${this.recupListePlayer()}`);
    }

    const questionReponse = await this.tirerQuestion();
    this.question = questionReponse[0];
    this.reponse = deburr(questionReponse[1]).toUpperCase();
    await this.masqueReponse();

    await this.repondre(`**------NOUVELLE QUESTION------**\n${this.getQuestion()}\nréponse: ${this.getReponseEtoile()}`);

  }

  masqueReponse(){

    let Lettre = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    this.reponseEtoile = '';

    return new Promise(resolve => {
      this.reponse.split('').forEach((caract,i) => {
        this.reponseEtoile += Lettre.indexOf(caract) == -1 ? caract : '*';
        
        if(i == this.reponse.length - 1){resolve()}
      })
    })

  }


  tirerQuestion(){

    return new Promise(resolve => {

      fs.readFile('./jeux/quizz/question.csv', 'utf8', (err, data) => {
        
        if (err) {
          console.error(`Une erreur s'est produite lors de la lecture du fichier :`, err);
          return;
        }

        let tabQuestion = data.split('\n');
        let indRand = parseInt(Math.random() * tabQuestion.length);
        
        resolve(tabQuestion[indRand].split(';'));
        
      });

    })

  }

  controleGagne(){
    return this.reponse == this.reponseEtoile;
  }

  joue(lettre){

    let trouve = false;

    this.reponse.split('').forEach((l,i) => {
      
      if(this.reponseEtoile[i] == '*' && l == lettre.toUpperCase()){
        
        let charArray = this.reponseEtoile.split(''); // Conversion en tableau de caractères
        charArray[i] = lettre.toUpperCase(); // Remplacement du deuxième caractère (index 1)
        this.reponseEtoile = charArray.join(''); // Conversion du tableau en chaîne de caractères
       
        trouve = true

      }

    })

    return trouve;
  }


  getQuestion(){

    return  '```' + this.question + ' ?```';

  }

  getReponseEtoile(){

    return  '```' + this.reponseEtoile + '```';

  }

  finPartie(){
    this.partieStart = false;
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