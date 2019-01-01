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

var flickEstimate = {};
var simulationSteps = 100;
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

    flickEstimate = this.physics.add.sprite(0,0,'');
    flickEstimate.body.mass = pointMass;
    flickEstimate.body.radius = 16;
    flickEstimate.body.enable = false;
    flickEstimate.visible = false;

    this.anims.create(animConfig);

    //  Events

    this.input.on('pointerdown', function (pointer) {
        if (pointer.event.cancelBubble == true) {return;}
        
        flickEstimate.body.velocity = Phaser.Math.Vector2.ZERO;

        var points = simulateFrom(flickEstimate,pointer.x,pointer.y,simulationSteps);
        for(var i=0;i<points.length-1;i++)
        {
            drawLine(points[i].x,points[i].y,points[i+1].x,points[i+1].y,2,0xff0ff);
        }
    });

    this.input.on('pointerup', function (pointer) {
        if (!flickEstimate) {return;}
        graphics.clear();
        var point = this.physics.add.sprite(pointer.downX,pointer.downY,'point');
        point.body.mass = pointMass;
        point.body.radius = 16;
        // TODO: Be a little less precise to account for not as precise human movement, maybe use a very small grid snapping
        
        // Pull to fling
        //point.body.velocity.setTo((pointer.downX-pointer.upX)*flickScale,(pointer.downY-pointer.upY)*flickScale);
        
        // Flick to fling
        point.body.velocity.setTo((pointer.upX-pointer.downX)*flickScale,(pointer.upY-pointer.downY)*flickScale);

        point.setScale(pointScale);
        points.push(point);
    },this);

    this.input.on('pointermove', function (pointer) {
        if(!pointer.isDown) { return; }
        // Only do stuff if the pointer is down
        graphics.clear();

        flickEstimate.body.velocity.setTo((pointer.x-pointer.downX)*flickScale,(pointer.y-pointer.downY)*flickScale);
        var points = simulateFrom(flickEstimate,pointer.downX,pointer.downY,simulationSteps);
        for(var i=0;i<points.length-1;i++)
        {
            drawLine(points[i].x,points[i].y,points[i+1].x,points[i+1].y,2,0xff0ff);
        }
    });
}

function update(elapsedTime, delta)
{ 
    points.forEach((p,idx) => {
        updateBody(p,idx);
    });
}

function simulateFrom(obj,x,y,steps)
{
    if (steps === undefined)
        steps = 1000;
    var delta = 16.666599999999743/steps;
    var points = [];
    obj.x = x;
    obj.y = y;
    obj.body.enable = true;

    // TODO: do smarter updates?
    for(var i=0;i<steps;i++)
    {
        var cont = simulateUpdate(obj,delta);
        obj.x += obj.body.velocity.x * delta;
        obj.y += obj.body.velocity.y * delta;
        points[i] = new Phaser.Math.Vector2(obj.x,obj.y);
        if (!cont)
            break;
    }

    obj.body.enable = false;
    
    return points;
}

function accelerateToObject(gameObject,to,speed)
{
    var angle = Math.atan2(to.y - gameObject.y, to.x - gameObject.x);

    gameObject.body.acceleration.setToPolar(angle, speed);
    
    return angle;
}

function simulateUpdate(obj, delta) {
    if (delta===undefined) { delta = 0.1; }
    obj.body.acceleration.setTo(0, 0);
    //var scene = ast_.scene;
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
 
            accelerateToObject(points[ast], item, (((item.body.mass) / r)));
                    
            ax = ax + points[ast].body.acceleration.x;         
            ay = ay + points[ast].body.acceleration.y;         
            ast.body.acceleration.setTo(ax, ay);       
        }     
    }, this, false, obj);
    //Accelerate to planet
    var ax = obj.body.acceleration.x;
    var ay = obj.body.acceleration.y;
    var dx = obj.x - planet.x;
    var dy = obj.y - planet.y;     
    var r = dx * dx + dy * dy;
    if (r < planet.radius * planet.radius) { //|| (r > killRadius * killRadius)) {       
        return false;
    } else {
        accelerateToObject(obj, planet, (planet.body.mass / r));
        ax = ax + obj.body.acceleration.x;       
        ay = ay + obj.body.acceleration.y;       
        obj.body.acceleration.setTo(ax, ay);
    }
    computeVelocity(obj.body,delta);
    return true;
}

function computeVelocity(body, delta)
{
    var velocityX = body.velocity.x;
    var accelerationX = body.acceleration.x;
    var dragX = body.drag.x;
    var maxX = body.maxVelocity.x;

    var velocityY = body.velocity.y;
    var accelerationY = body.acceleration.y;
    var dragY = body.drag.y;
    var maxY = body.maxVelocity.y;

    var speed = body.speed;
    var allowDrag = body.allowDrag;
    var useDamping = body.useDamping;

    if (body.allowGravity)
    {
        var gravX = config.physics.arcade.gravity.x ? config.physics.arcade.gravity.x : 0;
        var gravY = config.physics.arcade.gravity.y ? config.physics.arcade.gravity.y : 0;
        velocityX += (gravX + body.gravity.x) * delta;
        velocityY += (gravY + body.gravity.y) * delta;
    }

    if (accelerationX)
    {
        velocityX += accelerationX * delta;
    }
    else if (allowDrag && dragX)
    {
        if (useDamping)
        {
            //  Damping based deceleration
            velocityX *= dragX;

            if (FuzzyEqual(speed, 0, 0.001))
            {
                velocityX = 0;
            }
        }
        else
        {
            //  Linear deceleration
            dragX *= delta;

            if (FuzzyGreaterThan(velocityX - dragX, 0, 0.01))
            {
                velocityX -= dragX;
            }
            else if (FuzzyLessThan(velocityX + dragX, 0, 0.01))
            {
                velocityX += dragX;
            }
            else
            {
                velocityX = 0;
            }
        }
    }

    if (accelerationY)
    {
        velocityY += accelerationY * delta;
    }
    else if (allowDrag && dragY)
    {
        if (useDamping)
        {
            //  Damping based deceleration
            velocityY *= dragY;

            if (FuzzyEqual(speed, 0, 0.001))
            {
                velocityY = 0;
            }
        }
        else
        {
            //  Linear deceleration
            dragY *= delta;

            if (FuzzyGreaterThan(velocityY - dragY, 0, 0.01))
            {
                velocityY -= dragY;
            }
            else if (FuzzyLessThan(velocityY + dragY, 0, 0.01))
            {
                velocityY += dragY;
            }
            else
            {
                velocityY = 0;
            }
        }
    }

    velocityX = Phaser.Math.Clamp(velocityX, -maxX, maxX);
    velocityY = Phaser.Math.Clamp(velocityY, -maxY, maxY);

    body.velocity.set(velocityX, velocityY);
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