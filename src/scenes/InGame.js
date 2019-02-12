import Phaser from 'phaser'
import Planet from '../spaceobjects/Planet'
import EnemyRocket from '../spaceobjects/EnemyRocket'

import Asteroid from '../spaceobjects/Asteroid'
import MineralType from '../components/MineralType'

export default class extends Phaser.Scene
{
    constructor()
    {
        super({ key: 'InGame', active: true});
        this.spaceObjects = [];
        this.pointMass = 1;
        this.pointScale = 0.25;
        this.planet;
        this.planetMass = 597200; 

        this.flickScale = 1;
        this.inaccuracy = 1;

        this.flickEstimate = {};
        this.simulationSteps = 100;
        this.graphics;

        this.cost = true;

        this.spawning = false;

        this.money = 0;
        this.timer = 0;

        this.referenceWidth = 1024;
        this.referenceHeight = 768;
    }

    update(elapsedTime, delta)
    {
        this.spaceObjects.forEach((p,idx) => {
            this.updateBody(p,idx);
            if (p.scanForTarget !== undefined)
            {
                p.scanForTarget(this.spaceObjects);
            }
        },this);

        this.timer += delta;
        if (this.timer > 500)
        {
            this.money += 1;
            this.timer = 0;
        }
    }

    preload ()
    {
        this.load.spritesheet('Collector', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
        this.load.spritesheet('Shielder-full', 'assets/shielder-full.png', { frameWidth: 29, frameHeight: 14 });
        this.load.spritesheet('Shielder-empty', 'assets/shielder-empty.png', { frameWidth: 29, frameHeight: 14 });
        this.load.spritesheet('WeaponPlatform', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
        this.load.spritesheet('Interceptor', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
        this.load.spritesheet('asteroid', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
        this.load.spritesheet('bullet', 'assets/point.png', { frameWidth: 29, frameHeight: 29 });
        this.load.spritesheet('planet', 'assets/planet.png', { frameWidth: 107, frameHeight: 109});
        this.load.spritesheet('boom', 'assets/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
        this.load.spritesheet('rocket', 'assets/rocket.png', { frameWidth: 23, frameHeight: 38});
        this.load.atlas('flares', 'assets/flares.png', 'assets/flares.json');
    }

    create()
    {
        var me = this;
        this.uiScene = this.game.scene.getScene('InGameUI');

        window.addEventListener('resize', function (event) {
            me.resize(window.innerWidth, window.innerHeight);
        }, false);
        var config = this.game.config;
        this.graphics = this.add.graphics();

        this.events.on('resize', me.resize, me);
        
        this.planet = new Planet(this,config.width/2,config.height/2,this.planetMass,'planet');

        this.resize(window.innerWidth,window.innerHeight);

        var animConfig = {
            key: 'explode',
            frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 23, first: 23 }),
            frameRate: 30,
            repeat: 0
        };

        this.anims.create(animConfig);

        this.flickEstimate = this.physics.add.sprite(0,0,'');
        this.flickEstimate.body.mass = this.pointMass;
        this.flickEstimate.body.radius = 32*this.pointScale;
        this.flickEstimate.body.enable = false;
        this.flickEstimate.visible = false;

        //  Events

        this.input.on('pointerdown', function (pointer) {
            if (pointer.event.cancelBubble == true) {return;}

            var downPoint = this.cameras.main.getWorldPoint(pointer.x,pointer.y);
            if (this.money < this.spawnMode.cost && this.cost) 
            {
                this.uiScene.showError("Need at least "+this.spawnMode.cost+" money",downPoint);
                pointer.event.cancelBubble = true;
                return;
            }
            this.spawning = true;
            if (this.spawnMode == 'enemies')
            {
                // Spawn Rocket
                var enemy = new EnemyRocket(this,downPoint.x,downPoint.y,this.pointMass,'rocket');
                this.physics.accelerateToObject(enemy, this.planet, 5);
                enemy.rotation = Phaser.Math.Angle.BetweenPoints(enemy,this.planet)+Math.PI/2;
                enemy.setScale(this.pointScale);
                enemy.body.mass = this.pointMass;
                enemy.onDestroyed(this.destroyObject);
                this.spaceObjects.push(enemy);
            }
            else
            {
                this.flickEstimate.body.velocity = Phaser.Math.Vector2.ZERO;

                var points = this.simulateFrom(this.flickEstimate,downPoint.x,downPoint.y,this.simulationSteps);
                for(var i=0;i<points.length-1;i++)
                {
                    this.drawLine(points[i].x,points[i].y,points[i+1].x,points[i+1].y,2,0xff0ff);
                }

            }
        }, this);

        this.input.on('pointerup', function (pointer) {
            if (!this.spawning || this.spawnMode == 'enemies') {return;}
            this.graphics.clear();
            var texture = this.spawnMode.name == 'Shielder' ? 'Shielder-full' : this.spawnMode.name; 
            
            var downPoint = this.cameras.main.getWorldPoint(pointer.downX,pointer.downY);
            var upPoint = this.cameras.main.getWorldPoint(pointer.upX,pointer.upY)

            var point = new this.spawnMode.class(this,downPoint.x,downPoint.y,this.pointMass,texture);
            if (this.spawnMode.name != "Shielder")
            {
                point.setScale(this.pointScale);
                if (this.spawnMode.name == "Collector")
                {
                    point.collectCallback = (obj) => { 
                        this.money += obj.mineralType.value;
                        //spaceObjects = spaceObjects.filter((o) => { o !== obj});
                        this.destroyObject(obj, false);
                    }
                }
            }
            else
            {
                point.setTarget(this.planet);
            }
                
            point.onDestroyed(this.destroyObject);

            // Pull to fling
            //point.setVelocity((pointer.downX-pointer.upX)*flickScale,(pointer.downY-pointer.upY)*flickScale);
            
            // Flick to fling
            point.setVelocity((upPoint.x-downPoint.x)*this.flickScale,(upPoint.y-downPoint.y)*this.flickScale);

            this.spaceObjects.push(point);
            this.money -= this.spawnMode.cost;
            this.spawning = false;
        },this);

        this.input.on('pointermove', function (pointer) {
            if(!pointer.isDown || !this.spawning || this.spawnMode == 'enemies') { return; }
            // Only do stuff if the pointer is down
            this.graphics.clear();

            var downPoint = this.cameras.main.getWorldPoint(pointer.downX,pointer.downY);
            var currentPoint = this.cameras.main.getWorldPoint(pointer.x,pointer.y);

            this.flickEstimate.body.velocity.setTo((currentPoint.x-downPoint.x)*this.flickScale,(currentPoint.y-downPoint.y)*this.flickScale);
            var points = this.simulateFrom(this.flickEstimate,downPoint.x,downPoint.y,this.simulationSteps);
            for(var i=0;i<points.length-1;i++)
            {
                this.drawLine(points[i].x,points[i].y,points[i+1].x,points[i+1].y,2,0xff0ff);
            }
        },this);

        // TODO: Create Spawners
        this.time.delayedCall(Phaser.Math.RND.integerInRange(8,10)*1000, this.spawnAsteroid,[],this);
        this.time.delayedCall(Phaser.Math.RND.integerInRange(3,8)*1000, this.spawnEnemy,[],this);
    }
    
    resize(width,height)
    {
        // TODO: Detect landscape vs portrait?
        // Set zoom level to keep the area around the planet visible
        this.cameras.main.setZoom(width/this.referenceWidth);
        // Set viewport so you can see everything..
        this.cameras.main.setViewport(0,0,width,height);
        // Scroll so the planet is roughly in the center
        var halfWidth = width*0.5;
        var halfHeight = height*0.5;
        var x = -halfWidth + this.planet.x;
        var y = -halfHeight + this.planet.y;
        this.cameras.main.setScroll(x,y);
        this.game.config.width = width;
        this.game.config.height = height;
    }
    
    spawnAsteroid()
    {
        // Points to use
        var spawnPoint = new Phaser.Math.Vector2();
        var center = new Phaser.Math.Vector2();
        this.planet.getCenter(center);
        center.x += Phaser.Math.RND.between(-200,200);
        center.y += Phaser.Math.RND.between(-200,200);
        // Get the distance from the planet
        var radius = Phaser.Math.RND.between(500,1500);
        // Get a point on the circumference of the spawn area
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

        var asteroid = new Asteroid(
            this, 
            spawnPoint.x, 
            spawnPoint.y, 
            MineralType[mineralKeys[Phaser.Math.RND.between(0,mineralKeys.length-1)]], 
            1, 
            'asteroid'
        );
        asteroid.body.setVelocity(velocity.x,velocity.y);
        asteroid.setScale(0.25);
        asteroid.onDestroyed(this.destroyObject);
        this.spaceObjects.push(asteroid);
        // Schedule another asteroid
        this.time.delayedCall(Phaser.Math.RND.integerInRange(8,10)*1000, this.spawnAsteroid,[],this);
    }


    spawnEnemy()
    {
        // Points to use
        var spawnPoint = new Phaser.Math.Vector2();
        var center = new Phaser.Math.Vector2();
        this.planet.getCenter(center);
        center.x += Phaser.Math.RND.between(-64,64);
        center.y += Phaser.Math.RND.between(-64,64);
        // Get the distance from the planet
        var radius = Phaser.Math.RND.between(500,1500);
        // Get a point on the circumference of the spawn area
        Phaser.Geom.Circle.GetPoint(new Phaser.Geom.Circle(center.x,center.y,radius),Phaser.Math.RND.frac(),spawnPoint);
        // Set a speed
        var speed = Phaser.Math.RND.between(10,50);
        // Point at the planet
        var dir = center.subtract(spawnPoint);
        // Set velocity to planet
        dir.normalize();
        var velocity = dir.scale(speed);

        var rocket = new EnemyRocket(
            this, 
            spawnPoint.x, 
            spawnPoint.y,
            1,
            'rocket'
        );
        rocket.rotation = Phaser.Math.Angle.BetweenPoints(rocket,this.planet)+Math.PI/2;
        rocket.setTarget(center.x,center.y);
        rocket.body.setVelocity(velocity.x,velocity.y);
        rocket.setScale(0.5);
        rocket.onDestroyed(this.destroyObject);
        this.spaceObjects.push(rocket);
        // Schedule another
        this.time.delayedCall(Phaser.Math.RND.integerInRange(3,8)*1000, this.spawnEnemy,[],this);
    }

    destroyObject(obj, explode) 
    {
        if (explode === undefined)
            explode = true
        var scene = this.spaceObjects === undefined ? this.scene : this;
        if (explode)
        {
            scene.explosion(obj.body.x,obj.body.y);
        }
        scene.spaceObjects = scene.spaceObjects.filter((val, idx) => {
            return obj != val;
        });
        obj.destroy();
    }

    simulateFrom(obj,x,y,steps)
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
            var cont = this.simulateUpdate(obj,delta);
            obj.x += obj.body.velocity.x * delta;
            obj.y += obj.body.velocity.y * delta;
            points[i] = new Phaser.Math.Vector2(obj.x,obj.y);
            if (!cont)
                break;
        }

        obj.body.enable = false;
        
        return points;
    }

    accelerateToObject(gameObject,to,speed)
    {
        var angle = Math.atan2(to.y - gameObject.y, to.x - gameObject.x);

        gameObject.body.acceleration.setToPolar(angle, speed);
        
        return angle;
    }

    simulateUpdate(obj, delta) 
    {
        if (delta===undefined) { delta = 0.1; }
        obj.body.acceleration.setTo(0, 0);
        //Loop around all points
        this.spaceObjects.forEach(function(item) {
            var ax = item.body.acceleration.x;
            var ay = item.body.acceleration.y;
            var dx = item.x - item.x;
            var dy = item.y - item.y;
            var r = dx * dx + dy * dy;
            if (r > obj.body.radius * obj.body.radius) {       
                //The force on a body is (body.mass)/r^2 so taking every non planet body with
                // mass=1 the acceleration = force,  (r is already squared save us a sqrt)
                this.accelerateToObject(item, obj, (((obj.body.mass) / r)));
                        
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
        var dx = obj.x - this.planet.x;
        var dy = obj.y - this.planet.y;     
        var r = dx * dx + dy * dy;
        if (r < this.planet.body.radius * this.planet.body.radius) { //|| (r > killRadius * killRadius)) {       
            return false;
        } else {
            this.accelerateToObject(obj, this.planet, (this.planet.body.mass / r));
            ax = ax + obj.body.acceleration.x;       
            ay = ay + obj.body.acceleration.y;       
            obj.body.acceleration.setTo(ax, ay);
        }
        this.computeVelocity(obj.body,delta);
        return true;
    }

    computeVelocity(body, delta)
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
            var gravX = this.game.config.physics.arcade.gravity.x ? this.game.config.physics.arcade.gravity.x : 0;
            var gravY = this.game.config.physics.arcade.gravity.y ? this.game.config.physics.arcade.gravity.y : 0;
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

    updateBody(ast_) 
    {
        if (ast_.body === undefined) { 
            // No body? Go away!
            return;
        }
        ast_.body.acceleration.setTo(0, 0);
        
        var scene = ast_.scene;
        //Loop around all points
        var destroyed = [];
        this.spaceObjects.forEach(function(item) {
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
                    if (item.active
                        && ast_.active)
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
            var dx = ast_.x - scene.planet.x;     
            var dy = ast_.y - scene.planet.y;     
            var r = dx * dx + dy * dy;
            if (r < scene.planet.body.radius * scene.planet.body.radius) { //|| (r > killRadius * killRadius)) {       
                ast_.takeDamage(1);
                scene.planet.takeDamage(1);
            } else {
                scene.physics.accelerateToObject(ast_, scene.planet, (scene.planet.body.mass / r));
                ax = ax + ast_.body.acceleration.x;       
                ay = ay + ast_.body.acceleration.y;       
                ast_.body.acceleration.setTo(ax, ay);
            }
        }   
    }

    explosion(x,y)
    {
        // TODO: Object pooling... and a better way to get to add. Is there internal pooling?
        var boom = this.add.sprite(x, y, 'boom', 23);
        boom.setScale(this.pointScale);

        boom.anims.play('explode');
        boom.on('animationcomplete', (v) => {
            boom.destroy();
        });
    }

    DEG2RAD(deg)
    {
        return deg*(Math.PI/180);
    }


    drawLine(x1,y1,x2,y2,width,color,trans)
    {
        width = !width ? 1 : width;
        color = !color ? 0xff00ff : color;
        trans = !trans ? 0.5 : trans;
        this.graphics.lineStyle(width,color,trans);
        this.graphics.strokeLineShape(new Phaser.Geom.Line(x1,y1,x2,y2));
    }

    drawArrow(x1,y1,x2,y2,width,color,trans)
    {
        width = !width ? 1 : width;
        color = !color ? 0xff00ff : color;
        trans = !trans ? 0.5 : trans;
        this.graphics.lineStyle(width,color,trans);
        var line = new Phaser.Geom.Line(x1,y1,x2,y2);
        this.graphics.strokeLineShape(line);
        var midPoint;
        midPoint = Phaser.Geom.Line.GetMidPoint(line);
        var arrowLine = new Phaser.Geom.Line(x2,y2,midPoint.x,midPoint.y);
        this.graphics.strokeLineShape(Phaser.Geom.Line.RotateAroundXY(arrowLine,x2,y2,DEG2RAD(20)));
        this.graphics.strokeLineShape(Phaser.Geom.Line.RotateAroundXY(arrowLine,x2,y2,DEG2RAD(-40)));
    }

    drawEllipse(ellipse,width,color,trans)
    {
        width = !width ? 2 : width;
        color = !color ? 0xffff00 : color;
        trans = !trans ? 0.5 : trans;
        this.graphics.lineStyle(width,color,trans);
        this.graphics.strokeEllipseShape(ellipse);
    }

    drawCircle(circle,width,color,trans)
    {
        width = !width ? 2 : width;
        color = !color ? 0xff0000 : color;
        trans = !trans ? 0.5 : trans;
        this.graphics.lineStyle(width,color,trans);
        this.graphics.strokeCircleShape(circle);
    }
}