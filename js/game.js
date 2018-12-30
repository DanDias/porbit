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
var graphics;
var destruction = true;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.spritesheet('point', 'assets/point.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('ui-button', 'assets/ui/button.png', { frameWidth: 80, frameHeight: 40});
    this.load.spritesheet('planet', 'assets/planet.png', { frameWidth: 128, frameHeight: 128});
    this.load.spritesheet('boom', 'assets/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
}

function create ()
{
    graphics = this.add.graphics();

    var button = new UIButton(this, config.width-85, config.height-25, 160, 50, "Destruction\nis "+destruction, { fill: '#000' });
    button.on("pointerdown", function(pointer) {
        pointer.event.cancelBubble = true;
        destruction = !destruction;
        this.setText("Destruction\nis "+destruction);
        pointer.consume
    });

    planet = this.physics.add.sprite(config.width/2,config.height/2,'planet');
    planet.alpha = 0.25;
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
        if (pointer.event.cancelBubble == true) {return;}
        flickEstimate = new Phaser.Geom.Ellipse(pointer.x,pointer.y,1,1);
    });

    this.input.on('pointerup', function (pointer) {
        if (!flickEstimate) {return;}
        var point = this.physics.add.sprite(pointer.downX,pointer.downY,'point');
        point.body.mass = pointMass;
        point.body.radius = 16;
        // TODO: Be a little less precise to account for not as precise human movement, maybe use a very small grid snapping
        
        // Pull to fling
        //point.body.velocity.setTo((pointer.downX-pointer.upX)*flickScale,(pointer.downY-pointer.upY)*flickScale);
        
        // Flick to fling
        point.body.velocity.setTo((pointer.upX-pointer.downX)*flickScale,(pointer.upY-pointer.downY)*flickScale);

        //point.orbit = new Phaser.Geom.Ellipse(pointer.x-10,pointer.y-10,50,80);
        
        point.setScale(pointScale);
        points.push(point);
        flickEstimate = null;

    },this);

    this.input.on('pointermove', function (pointer) {
        if (!flickEstimate) {return;}
        graphics.clear();

        drawArrow(pointer.downX,pointer.downY,pointer.x,pointer.y);
        var dist = Math.sqrt(Math.pow(planet.x-pointer.x,2)+Math.pow(planet.y-planet.y,2));
        var estimatedVelocity = {
            x: (pointer.x-pointer.downX)*flickScale,
            y: (pointer.y-pointer.downY)*flickScale
        };

        var center = new Phaser.Geom.Point(pointer.x-(9.8+estimatedVelocity.x),pointer.y);

        flickEstimate.x = center.x;
        flickEstimate.y = center.y;
        flickEstimate.width = estimatedVelocity.x*2;
        flickEstimate.height = estimatedVelocity.y*2;

        drawCircle(new Phaser.Geom.Circle(center.x,center.y,3));
        drawEllipse(flickEstimate);
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
    if (r < planet.radius * planet.radius && destruction) { //|| (r > killRadius * killRadius)) {       
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


function drawLine(x1,y1,x2,y2,width,color,trans)
{
    width = !width ? 1 : width;
    color = !color ? 0xff00ff : color;
    trans = !trans ? 0.5 : trans;
    graphics.lineStyle(width,color,trans);
    graphics.strokeLineShape(new Phaser.Geom.Line(x1,y1,x2,y2));
}

function drawArrow(x1,y1,x2,y2,width,color,trans)
{
    width = !width ? 1 : width;
    color = !color ? 0xff00ff : color;
    trans = !trans ? 0.5 : trans;
    graphics.lineStyle(width,color,trans);
    var line = new Phaser.Geom.Line(x1,y1,x2,y2);
    graphics.strokeLineShape(line);
    var midPoint;
    midPoint = Phaser.Geom.Line.GetMidPoint(line);
    var arrowLine = new Phaser.Geom.Line(x2,y2,midPoint.x,midPoint.y);
    graphics.strokeLineShape(Phaser.Geom.Line.RotateAroundXY(arrowLine,x2,y2,DEG2RAD(20)));
    graphics.strokeLineShape(Phaser.Geom.Line.RotateAroundXY(arrowLine,x2,y2,DEG2RAD(-40)));
}

function drawEllipse(ellipse,width,color,trans)
{
    width = !width ? 2 : width;
    color = !color ? 0xffff00 : color;
    trans = !trans ? 0.5 : trans;
    graphics.lineStyle(width,color,trans);
    graphics.strokeEllipseShape(ellipse);
}

function drawCircle(circle,width,color,trans)
{
    width = !width ? 2 : width;
    color = !color ? 0xff0000 : color;
    trans = !trans ? 0.5 : trans;
    graphics.lineStyle(width,color,trans);
    graphics.strokeCircleShape(circle);
}