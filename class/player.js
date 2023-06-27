class Player{

  constructor(id,nom){
    this.id = id;
    this.nom = nom;
    this.point = 0;
  }

  getName(){
    return this.nom;
  }

  getId(){
    return this.id;
  }

  getPoint(){
    return this.point;
  }

  addPoint(point){
    this.point += point;
  }

}

module.exports = Player;