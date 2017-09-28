'use strict';

// realization Vector

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        try {
            if (!(vector instanceof Vector)) {
                errorText = 'Можно прибавлять к вектору только вектор типа Vector';
                throw errorText;
            }
            return new Vector(this.x + vector.x, this.y + vector.y);
        } catch(e) {
            throw new Error(e);
        }
    }

    times(factor) {
        return new Vector(this.x*factor, this.y*factor);
    }
}

// realization Actor

class Actor {
    constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
        try {
            if( (!(pos instanceof Vector)) || (!(size instanceof Vector)) || (!(speed instanceof Vector))) {
                errorText = 'Все параметры должны быть типа Vector';
                throw errorText;
            }
            this.pos = pos;
            this.size = size;
            this.speed = speed;
        } catch (error) {
            throw new Error(e);
        }
    }

    act() {}

    get left() {
        return this.pos.x;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get top() {
        return this.pos.y;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }
    get type() {
        return 'actor';
    }

    isIntersect(obj) {
        var self = this;
        try {
            if ((!obj) || (!(obj instanceof Actor))) {
                errorText = 'Нужно передать не пустой параметр типа Actor';
                throw errorText;
            }

            if (obj === this) {
                return false;
            }

            return obj.right > this.left &&
                obj.left < this.right &&
                obj.bottom > this.top &&
                obj.top < this.bottom;

        } catch(error) {
            throw new Error(e);
        }
    }
}

// realization Level

class Level {
    constructor(arrayString = [], arrayObjs = []) {
        this.grid = arrayString;
        this.actors = arrayObjs;
        this.player = arrayObjs.find(function(elem) {
            return elem.type === 'player';
        });
        this.height = arrayString.length;
        this.width = arrayString.reduce(function(value, elem, index, arrayString) {
            value = value < elem.length ? elem.length : value;
            return value}, 0);
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        if (!(this.status === null) && (this.finishDelay < 0)) {
            return true;
        }
        return false;
    }

    actorAt(obj) {
        return this.actors.find(actor => actor.isIntersect(obj));
    }

    obstacleAt(pos, size) {
        var leftBorder = Math.floor(pos.x);
        var rightBorder = Math.ceil(pos.x + size.x);
        var topBorder = Math.floor(pos.y);
        var bottomBorder = Math.ceil(pos.y + size.y);

        if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
            return "wall";
        }

        if (bottomBorder > this.height) {
            return "lava";
        }

        for (var y = topBorder; y < bottomBorder; y++) {
            for (var x = leftBorder; x < rightBorder; x++) {
                var fieldType = this.grid[y][x];
                if (fieldType) {
                    return fieldType;
                }
            }
        }
    }

    removeActor(obj) {
        var indexObj = this.actors.indexOf(obj);
        this.actors.splice(indexObj, 1);
    }

    noMoreActors(type) {
        var objsFinded = this.actors.filter(function(elem) {
            return elem.type === type;
        });

        if (objsFinded.length === 0) {
            return true;
        }
        return false;
    }

    playerTouched(type, movedObj) {
        var _this = this;
        if (this.status !== null) {
            return false;
        }
        else if ((type == "lava") || (type == "fireball")) {
            this.status = "lost";
            this.finishDelay = 1;
        } else if (type == "coin") {
            this.actors = this.actors.filter(obj => obj != movedObj);
            if (this.noMoreActors('coin')) {
                this.status = "won";
                this.finishDelay = 1;
            }
        }
    }
}

// realization LevelParser

class LevelParser {
    constructor(dictionary){
        this.dictionary = dictionary || [];
    }

    actorFromSymbol(symbol) {
        if (symbol === undefined) {
            return undefined;
        }
        if (Object.keys(this.dictionary).indexOf(symbol) !== -1){
            return this.dictionary[symbol];
        }
        return undefined;
    }

    obstacleFromSymbol(symbol) {
        if (symbol === 'x') {
            return 'wall';
        }
        if (symbol === '!') {
            return 'lava';
        }
        return undefined;
    }

    createGrid(arrayStr) {
        var newArray = [];
        for (var i = 0; i < arrayStr.length; i++) {
            newArray[i] = [];
            for (var j = 0; j < arrayStr[i].length; j++) {
                newArray[i][j] = this.obstacleFromSymbol(arrayStr[i][j]);
            }
        }
        return newArray;
    }

    createActors(arrayStr) {
        var arrayActors = [], counter = 0;
        for (var i = 0; i < arrayStr.length; i++) {
            for (var j = 0; j < arrayStr[i].length; j++) {
                if ((this.actorFromSymbol(arrayStr[i][j])) && (!this.obstacleFromSymbol(arrayStr[i][j])) && (typeof (this.actorFromSymbol(arrayStr[i][j])) == 'function')) {
                    var funcCreate = this.actorFromSymbol(arrayStr[i][j]);
                    var objCreate = new funcCreate(new Vector(j, i));
                    if(Actor.prototype.isPrototypeOf(objCreate)) {
                        arrayActors[counter] = objCreate;
                        counter++;
                    }
                }
            }
        }

        return arrayActors;
    }

    parse(arrayStr) {
        return new Level(this.createGrid(arrayStr), this.createActors(arrayStr));
    }
}

// realization Fireball

class Fireball extends Actor {
    constructor(coords = new Vector(0,0), speed = new Vector(0,0)) {
        super(coords, new Vector(1,1), speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
        return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
    }

    handleObstacle() {
        this.speed = this.speed.times(-1);
    }

    act(time, level) {
        var newPos = this.getNextPosition(time);
        var isObstacle = level.obstacleAt(newPos, this.size);
        if (!isObstacle) {
            this.pos = newPos;
        }
        else {
            this.handleObstacle();
        }
    }
}

// realization HorizontalFireball

class HorizontalFireball extends Fireball {
    constructor(coords) {
        super(coords);
        this.speed.x = 2;
    }
}

// realization VerticalFireball

class VerticalFireball extends Fireball {
    constructor(coords) {
        super(coords);
        this.speed.y = 2;
    }
}

// realization FireRain

class FireRain extends Fireball {
    constructor(coords) {
        super(coords);
        this.speed.y = 3;
        this.startPos = coords;
    }

    handleObstacle() {
        this.pos = this.startPos;
    }
}

// realization Coin

class Coin extends Actor {
    constructor(coords) {
        super(coords);
        this.pos = this.pos.plus(new Vector(0.2, 0.1));
        this.size = new Vector(0.6, 0.6);
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = rand(Math.PI * 2, 0);
        this.startPos = this.pos;
    }

    get type() {
        return 'coin';
    }

    updateSpring(time = 1) {
        this.spring = this.spring + this.springSpeed * time;
    }

    getSpringVector() {
        return new Vector(0, this.springDist * Math.sin(this.spring));
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.startPos.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

// realization Player

class Player extends Actor {
    constructor(coords) {
        super(coords);
        this.pos = this.pos.plus(new Vector(0, -0.5));
        this.size = new Vector(0.8,1.5);
    }

    get type() {
        return 'player';
    }
}

function rand(max = 10, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// realization loadLevels

var schemasResponse, schemasCorrect = [], counter = 0;
loadLevels()
    .then(
        response => {
            var schemasResponse = response.slice(2,-2).split(',');
            schemasCorrect[counter] = [];
            for (var i = 0; i < schemasResponse.length; i++) {
                schemasResponse[i] = schemasResponse[i].trim();
                if (schemasResponse[i][0] == '[') {
                    schemasResponse[i] = schemasResponse[i].slice(1);
                    schemasResponse[i] = schemasResponse[i].trim();
                }
                if (schemasResponse[i].slice(-1) == ']') {
                    schemasResponse[i] = schemasResponse[i].slice(0, schemasResponse[i].length - 1);
                    schemasResponse[i] = schemasResponse[i].trim();
                    schemasResponse[i] = schemasResponse[i].slice(1);
                    schemasResponse[i] = schemasResponse[i].slice(0, -1);
                    schemasCorrect[counter].push(schemasResponse[i]);
                    counter++;
                    schemasCorrect[counter] = [];
                    continue;
                }
                schemasResponse[i] = schemasResponse[i].slice(1);
                schemasResponse[i] = schemasResponse[i].slice(0, -1);
                schemasCorrect[counter].push(schemasResponse[i]);
            }
            const actorDict = {
                '@': Player,
                'v': FireRain,
                'o': Coin,
                '=': HorizontalFireball,
                '|': VerticalFireball
            };
            schemasCorrect.pop();
            const parser = new LevelParser(actorDict);
            runGame(schemasCorrect, parser, DOMDisplay).then(() => console.log('Вы выиграли!'));
        },
    error => console.log(`Rejected: ${error}`)
    );

