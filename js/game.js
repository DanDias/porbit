var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    scene: {
        create: create,
        preload: preload,
        update: update,
        resize: resize
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

window.addEventListener('resize', function (event) {

    game.resize(window.innerWidth, window.innerHeight);

}, false);
var spaceObjects = [];
var pointMass = 1;
var pointScale = 0.25;
var planet;
var planetMass = 597200; 

var flickScale = 1;
var inaccuracy = 1;

var flickEstimate = {};
var simulationSteps = 100;
var graphics;

var cost = true;

var spawning = false;
var spawnMode = null;

var money = 0;
var timer = 0;

var moneyText;

var game = new Phaser.Game(config);

var spawnButtons = [];

var spawner =
{
    Collector: {
        class: Collector,
        cost: 10
    },
    Shielder: {
        class: Shielder,
        cost: 50
    },
    WeaponPlatform: {
        class: WeaponPlatform,
        cost: 100
    },
    Interceptor: {
        class: Interceptor,
        cost: 500
    }
}

function preload ()
{
    this.load.spritesheet('Collector', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
    this.load.spritesheet('Shielder-full', 'assets/shielder-full.png', { frameWidth: 29, frameHeight: 14 });
    this.load.spritesheet('Shielder-empty', 'assets/shielder-empty.png', { frameWidth: 29, frameHeight: 14 });
    this.load.spritesheet('WeaponPlatform', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
    this.load.spritesheet('Interceptor', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
    this.load.spritesheet('asteroid', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
    this.load.spritesheet('bullet', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
    this.load.spritesheet('ui-button', 'assets/ui/button.png', { frameWidth: 80, frameHeight: 40});
    this.load.spritesheet('planet', 'assets/planet.png', { frameWidth: 107, frameHeight: 109});
    this.load.spritesheet('boom', 'assets/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
    this.load.spritesheet('rocket', 'assets/rocket.png', { frameWidth: 23, frameHeight: 38});
}

function create ()
{
    graphics = this.add.graphics();

    moneyText = new Phaser.GameObjects.Text(this, 10, 10, "Money: "+money, { fill: '#FFF' });
    this.add.existing(moneyText);

    var debugBtn = new UIButton(this, config.width-85, config.height-25, 160, 50, (cost ? '' : 'Don\'t\n')+" Enforce Cost", { fill: '#000' });
    debugBtn.on("pointerdown", function(pointer) {
        pointer.event.cancelBubble = true;
        cost = !cost;
        this.setText((cost ? '' : 'Don\'t\n')+" Enforce Cost");
    });

    var xLoc = 75;
    Object.keys(spawner).forEach(function(key) {
        var item = spawner[key];
        var btn = new UIButton(this, xLoc, config.height-40, 150, 50, key+"\n$"+item.cost, { fill: '#000' });
        btn.on("pointerdown", function(pointer) {
            spawnButtons.forEach((b) => {
                b.setSelected(false);
            });
            pointer.event.cancelBubble = true;
            spawnMode = item;
            this.setSelected(true);
        });
        if (spawnMode === null)
        {
            spawnMode = item;
            btn.setSelected(true);
        }
        xLoc += 150
        spawnButtons.push(btn);
    },this);

    planet = new Planet(this,config.width/2,config.height/2,planetMass,'planet');

    var animConfig = {
        key: 'explode',
        frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 23, first: 23 }),
        frameRate: 30,
        repeat: 0
    };

    this.anims.create(animConfig);

    flickEstimate = this.physics.add.sprite(0,0,'');
    flickEstimate.body.mass = pointMass;
    flickEstimate.body.radius = 32*pointScale;
    flickEstimate.body.enable = false;
    flickEstimate.visible = false;

    //  Events

    this.input.on('pointerdown', function (pointer) {
        if (pointer.event.cancelBubble == true) {return;}

        if (money < spawnMode.cost && cost) 
        {
            var error = new FloatingText(this,pointer.x,pointer.y+30,"Need at least "+spawnMode.cost+" money", {fill:'#FFF'});
            this.add.existing(error);
            pointer.event.cancelBubble = true;
            return;
        }
        spawning = true;
        if (spawnMode == 'enemies')
        {
            // Spawn Rocket
            var enemy = new EnemyRocket(this,pointer.x,pointer.y,pointMass,'rocket');
            this.physics.accelerateToObject(enemy, planet, 5);
            enemy.rotation = Phaser.Math.Angle.BetweenPoints(enemy,planet)+Math.PI/2;
            enemy.setScale(pointScale);
            enemy.body.mass = pointMass;
            enemy.onDestroyed(destroyObject);
            spaceObjects.push(enemy);
        }
        else
        {
            flickEstimate.body.velocity = Phaser.Math.Vector2.ZERO;

            var points = simulateFrom(flickEstimate,pointer.x,pointer.y,simulationSteps);
            for(var i=0;i<points.length-1;i++)
            {
                drawLine(points[i].x,points[i].y,points[i+1].x,points[i+1].y,2,0xff0ff);
            }

        }
    }, this);

    this.input.on('pointerup', function (pointer) {
        if (!spawning || spawnMode == 'enemies') {return;}
        graphics.clear();
        var texture = spawnMode.class.name == 'Shielder' ? 'Shielder-full' : spawnMode.class.name; 
        
        var point = new spawnMode.class(this,pointer.downX,pointer.downY,pointMass,texture);
        if (point.type != "Shielder")
            point.setScale(pointScale);
        else
            point.setTarget(planet);
            
        point.onDestroyed(destroyObject);

        // Pull to fling
        //point.setVelocity((pointer.downX-pointer.upX)*flickScale,(pointer.downY-pointer.upY)*flickScale);
        
        // Flick to fling
        point.setVelocity((pointer.upX-pointer.downX)*flickScale,(pointer.upY-pointer.downY)*flickScale);

        spaceObjects.push(point);
        money -= spawnMode.cost;
        spawning = false;
    },this);

    this.input.on('pointermove', function (pointer) {
        if(!pointer.isDown || !spawning || spawnMode == 'enemies') { return; }
        // Only do stuff if the pointer is down
        graphics.clear();

        flickEstimate.body.velocity.setTo((pointer.x-pointer.downX)*flickScale,(pointer.y-pointer.downY)*flickScale);
        var points = simulateFrom(flickEstimate,pointer.downX,pointer.downY,simulationSteps);
        for(var i=0;i<points.length-1;i++)
        {
            drawLine(points[i].x,points[i].y,points[i+1].x,points[i+1].y,2,0xff0ff);
        }
    });

    //spawnAsteroid(this);
    this.time.delayedCall(Phaser.Math.RND.integerInRange(3,8)*1000, spawnEnemy,[this]);
}

function update(elapsedTime, delta)
{
    spaceObjects.forEach((p,idx) => {
        updateBody(p,idx);
        if (p.scanForTarget !== undefined)
        {
            p.scanForTarget(spaceObjects);
        }
    });

    updateMoney(delta);
}

function resize (width, height)
{
    if (width === undefined) { width = this.sys.game.config.width; }
    if (height === undefined) { height = this.sys.game.config.height; }

    // TODO: Resize all game elements
}

function spawnAsteroid(scene)
{
    // Points to use
    var spawnPoint = new Phaser.Math.Vector2();
    var center = new Phaser.Math.Vector2();
    planet.getCenter(center);
    center.x += Phaser.Math.RND.between(-200,200);
    center.y += Phaser.Math.RND.between(-200,200);
    // Get the distance from the planet
    var radius = Phaser.Math.RND.between(500,1500);
    // Get a point on the cicumference of the spawn area
    Phaser.Geom.Circle.GetPoint(new Phaser.Geom.Circle(center.x,center.y,radius),Phaser.Math.RND.frac(),spawnPoint);
    // Set a speed
    var speed = Phaser.Math.RND.between(50,250);
    // Point at the planet
    // TODO: Maybe just point it in a random direction on the unit circle with less velocity, to give a better shape to their approach
    var dir = center.subtract(spawnPoint);
    // Set velocity to planet
    dir.normalize();
    var velocity = dir.scale(speed);

    var mineralKeys = Object.keys(MineralType);

    var asteroid = new Mineral(
        scene, 
        spawnPoint.x, 
        spawnPoint.y, 
        MineralType[mineralKeys[Phaser.Math.RND.between(0,mineralKeys.length-1)]], 
        1, 
        'asteroid'
    );
    asteroid.body.setVelocity(velocity.x,velocity.y);
    asteroid.setScale(0.25);
    asteroid.onDestroyed(destroyObject);
    spaceObjects.push(asteroid);
    // Schedule another asteroid
    scene.time.delayedCall(Phaser.Math.RND.integerInRange(1,10)*1000, spawnAsteroid,[scene]);
}


function spawnEnemy(scene)
{
    // Points to use
    var spawnPoint = new Phaser.Math.Vector2();
    var center = new Phaser.Math.Vector2();
    planet.getCenter(center);
    center.x += Phaser.Math.RND.between(-64,64);
    center.y += Phaser.Math.RND.between(-64,64);
    // Get the distance from the planet
    var radius = Phaser.Math.RND.between(500,1500);
    // Get a point on the cicumference of the spawn area
    Phaser.Geom.Circle.GetPoint(new Phaser.Geom.Circle(center.x,center.y,radius),Phaser.Math.RND.frac(),spawnPoint);
    // Set a speed
    var speed = Phaser.Math.RND.between(10,50);
    // Point at the planet
    var dir = center.subtract(spawnPoint);
    // Set velocity to planet
    dir.normalize();
    var velocity = dir.scale(speed);

    var rocket = new EnemyRocket(
        scene, 
        spawnPoint.x, 
        spawnPoint.y,
        1,
        'rocket'
    );
    rocket.rotation = Phaser.Math.Angle.BetweenPoints(rocket,planet)+Math.PI/2;
    rocket.setTarget(center.x,center.y);
    rocket.body.setVelocity(velocity.x,velocity.y);
    rocket.setScale(0.5);
    rocket.onDestroyed(destroyObject);
    spaceObjects.push(rocket);
    // Schedule another
    scene.time.delayedCall(Phaser.Math.RND.integerInRange(3,8)*1000, spawnEnemy,[scene]);
}


function updateMoney(delta)
{
    timer += delta;
    if (timer > 500)
    {
        money += 1;
        timer = 0;
    }
    moneyText.text = "Money: "+money;
}

function destroyObject(obj) 
{
    explosion(
        obj.body.x,
        obj.body.y,
        obj.body.velocity.x - inaccuracy,
        obj.body.velocity.x + inaccuracy,
        obj.body.velocity.y - inaccuracy,
        obj.body.velocity.y + inaccuracy);
    obj.destroy();
    spaceObjects = spaceObjects.filter((val, idx) => {
        return obj != val;
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
    //Loop around all points
    spaceObjects.forEach(function(item) {
        var ax = item.body.acceleration.x;
        var ay = item.body.acceleration.y;
        var dx = item.x - item.x;
        var dy = item.y - item.y;
        var r = dx * dx + dy * dy;
        if (r > obj.body.radius * obj.body.radius) {       
            //The force on a body is (body.mass)/r^2 so taking every non planet body with
            // mass=1 the acceleration = force,  (r is already squared save us a sqrt)
            accelerateToObject(item, obj, (((obj.body.mass) / r)));
                    
            ax = ax + item.body.acceleration.x;
            ay = ay + item.body.acceleration.y;
            item.body.acceleration.setTo(ax, ay);
        }
        else
        {
            return false;
        }
    });
    //Accelerate to planet
    var ax = obj.body.acceleration.x;
    var ay = obj.body.acceleration.y;
    var dx = obj.x - planet.x;
    var dy = obj.y - planet.y;     
    var r = dx * dx + dy * dy;
    if (r < planet.body.radius * planet.body.radius) { //|| (r > killRadius * killRadius)) {       
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

function updateBody(ast_) {
    if (ast_.body === undefined) { 
        // No body? Go away!
        return;
    }
    ast_.body.acceleration.setTo(0, 0);

    var scene = ast_.scene;
    //Loop around all points
    var destroyed = [];
    spaceObjects.forEach(function(item) {
        if (item !== ast_)
        {
            var ax = item.body.acceleration.x;
            var ay = item.body.acceleration.y;
            var dx = item.x - ast_.x;
            var dy = item.y - ast_.y;
            var r = dx * dx + dy * dy;
            if (r > ast_.body.radius * ast_.body.radius) {       
                //The force on a body is (body.mass)/r^2 so taking every non planet body with       
                // mass=1 the acceleration = force,  (r is already squared save us a sqrt)         
                scene.physics.accelerateToObject(item, ast_, (((item.body.mass) / r)));        
                ax = ax + item.body.acceleration.x;         
                ay = ay + item.body.acceleration.y;         
                item.body.acceleration.setTo(ax, ay);       
            }
            else
            {
                destroyed.push(item);
            }
        }
    });
    if (destroyed.length > 0)
    {
        for(var i=0;i<destroyed.length;i++)
        {
            destroyed[i].takeDamage(1);
        }
        ast_.takeDamage(1);        
    }
    else
    {
        //Accelerate to planet
        var ax = ast_.body.acceleration.x;     
        var ay = ast_.body.acceleration.y;     
        var dx = ast_.x - planet.x;     
        var dy = ast_.y - planet.y;     
        var r = dx * dx + dy * dy;
        if (r < planet.body.radius * planet.body.radius) { //|| (r > killRadius * killRadius)) {       
            ast_.takeDamage(1);
        } else {
            scene.physics.accelerateToObject(ast_, planet, (planet.body.mass / r));
            ax = ax + ast_.body.acceleration.x;       
            ay = ay + ast_.body.acceleration.y;       
            ast_.body.acceleration.setTo(ax, ay);
        }
    }   
}

function explosion(x,y,negx,posx,negy,posy)
{
    // TODO: Object pooling... and a better way to get to add. Is there internal pooling?
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