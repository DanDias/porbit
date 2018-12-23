var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: {
        create: create,
        preload: preload,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};
var points = [];
var pointMass = 1;
var pointScale = 0.25;
var planet;
var planetMass = 597200; 

var flickScale = 1;
var inaccuracy = 1;

var flickEstimate = null;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.spritesheet('point', 'assets/point.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('planet', 'assets/planet.png', { frameWidth: 128, frameHeight: 128});
    this.load.spritesheet('boom', 'assets/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
}

function create ()
{
    var graphics = this.add.graphics();

    var color = 0xffff00;
    var thickness = 2;
    var alpha = 0.5;

    graphics.lineStyle(thickness,color,alpha);

    planet = this.physics.add.sprite(config.width/2,config.height/2,'planet');
    planet.body.mass = planetMass;
    planet.radius = 55;

    var animConfig = {
        key: 'explode',
        frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 23, first: 23 }),
        frameRate: 30,
        repeat: 0
    };

    this.anims.create(animConfig);

    //  Events

    this.input.on('pointerdown', function (pointer) {
        var center = {
            x: planet.x+(pointer.x-planet.x)*0.5,
            y: planet.y+(pointer.y-planet.y)*0.5
        }
        flickEstimate = new Phaser.Geom.Ellipse(center.x,center.y,50,50);
    });

    this.input.on('pointerup', function (pointer) {

        var point = this.physics.add.sprite(pointer.x,pointer.y,'point');
        point.body.mass = pointMass;
        point.body.radius = 16;
        // TODO: Be a little less precise to account for not as precise human movement, maybe use a very small grid snapping
        
        // Pull to fling
        //point.acceleration = {x:(pointer.downX-pointer.upX)*flickScale,y:(pointer.downY-pointer.upY)*flickScale};
        
        // Flick to fling
        point.body.velocity.setTo((pointer.upX-pointer.downX)*flickScale,(pointer.upY-pointer.downY)*flickScale);

        //point.orbit = new Phaser.Geom.Ellipse(pointer.x-10,pointer.y-10,50,80);
        
        point.setScale(pointScale);
        points.push(point);
        flickEstimate = null;

    },this);

    this.input.on('pointermove', function (pointer) {

        if (flickEstimate !== null)
        {
            graphics.clear();

            var dist = Math.sqrt(Math.pow(planet.x-pointer.x,2)+Math.pow(planet.y-planet.y,2));




            graphics.strokeEllipseShape(flickEstimate);
        }
        
    });
}

function update(elapsedTime, delta)
{
    // 60 FPS
    delta /= 60;
    points.forEach((p,idx) => {
        updateBody(p,idx);
    });
}

function updateBody(ast_,idx) {
    ast_.body.acceleration.setTo(0, 0);
    var scene = ast_.scene;
    //Loop around all points
    points.forEach(function(item, ast) {
        var ax = points[ast].body.acceleration.x;
        var ay = points[ast].body.acceleration.y;
        var dx = points[ast].x - item.x;
        var dy = points[ast].y - item.y;
        var r = dx * dx + dy * dy;
        if (r > item.radius * item.radius) {       
            //The force on a body is (body.mass)/r^2 so taking every non planet body with       
            // mass=1 the acceleration = force,  (r is already squared save us a sqrt)         
            scene.physics.accelerateToObject(points[ast], item, (((item.body.mass) / r)));        
            ax = ax + points[ast].body.acceleration.x;         
            ay = ay + points[ast].body.acceleration.y;         
            ast.body.acceleration.setTo(ax, ay);       
        }     
    }, this, false, ast_);
    //Accelerate to planet
    var ax = ast_.body.acceleration.x;     
    var ay = ast_.body.acceleration.y;     
    var dx = ast_.x - planet.x;     
    var dy = ast_.y - planet.y;     
    var r = dx * dx + dy * dy;
    if (r < planet.radius * planet.radius) { //|| (r > killRadius * killRadius)) {       
        explosion(ast_.body.x, ast_.body.y,
                     ast_.body.velocity.x - inaccuracy, 
                     ast_.body.velocity.x + inaccuracy,         
                     ast_.body.velocity.y - inaccuracy, 
                     ast_.body.velocity.y + inaccuracy);
        ast_.destroy();
        points.splice(idx,1);
    } else {
        scene.physics.accelerateToObject(ast_, planet, (planet.body.mass / r));       
        ax = ax + ast_.body.acceleration.x;       
        ay = ay + ast_.body.acceleration.y;       
        ast_.body.acceleration.setTo(ax, ay);     
    }   
}

function explosion(x,y,negx,posx,negy,posy)
{
    // TODO: Object pooling... and a better way to get to add
    var boom = game.scene.scenes[0].add.sprite(x, y, 'boom', 23);
    boom.setScale(pointScale);

    boom.anims.play('explode');
    boom.on('animationcomplete', (v) => {
        boom.destroy();
    });
}

function DEG2RAD(deg)
{
    return deg*(Math.PI/180);
}