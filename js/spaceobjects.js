class OrbitObject extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.mass = mass;
        this.body.radius = this.width*0.5;

        this.durability = 1;
        this.type = "OrbitObject";
    }

    setScale(scale)
    {
        super.setScale(scale);
        this.body.radius = this.width*0.5*scale;
    }

    setVelocity(x,y)
    {
        this.body.velocity.setTo(x,y);
    }

    onDestroyed(callback)
    {
        this.destroyed = callback;
    }

    onCollide(callback)
    {
        this.collision = callback;
    }

    doCollision(other)
    {
        if (this.collision !== undefined)
            this.collision(other);
    }

    takeDamage(damage)
    {
        this.durability -= damage; // TODO: Use mass and speed somehow instead?
        if (this.destroyed !== undefined && this.durability <= 0)
            this.destroyed(this);
    }
}

class Planet extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        // TODO: realistic duribility
        this.durability = 999999999999999999999999;
        this.type = "Planet";
    }
}


class Ship extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.type = "Ship";
        this.detectionRadius = 50;
        this.targetTypes = [];
        this.targets = [];
    }

    scanForTarget(objects)
    {
        var detectionArea = new Phaser.Geom.Circle(this.x,this.y,this.detectionRadius);
        objects.forEach((obj) => {
            if (this.targetTypes.filter((type) => type == obj.type).length > 0 
                && Phaser.Geom.Circle.ContainsPoint(detectionArea,new Phaser.Geom.Point(obj.x,obj.y))
                && this.targets.filter((t) => t === obj).length == 0)
            {
                console.log(this.type + " acquired target " + obj.type);
                obj.on("destroy", () => {
                    this.targets = this.targets.filter((o) => { o !== obj });                    
                });
                this.targets.push(obj);
            }
        });
    }

    getClosestTarget() 
    {
        var dist = this.detectionRadius*2;
        var obj = this.targets.filter((v) => {
            var checkDist = Phaser.Math.Distance.Between(v.x,v.y,this.x,this.y)
            if (checkDist <= dist)
            {
                dist = checkDist;
                return true;
            }
            else
            {
                return false;
            }
        })[0];
        return obj;
    }

    getInterceptPoint(obj,speed)
    {
        // Things we know
        var objPos = new Phaser.Math.Vector2(obj.x,obj.y);
        var objVel = new Phaser.Math.Vector2(obj.body.velocity.x,obj.body.velocity.y);
        var thisPos = new Phaser.Math.Vector2(this.x,this.y);
        
        var ox = thisPos.x - objPos.x;
        var oy = thisPos.y - objPos.y;

        var h1 = objVel.x * objVel.x + objVel.y * objVel.y - speed * speed;
        var h2 = ox * objVel.x + oy * objVel.y;
        var t;
        if (h1 == 0) { // problem collapses into a simple linear equation 
            t = -(ox * ox + oy * oy) / (2*h2);
        } else { // solve the quadratic equation
            var minusPHalf = -h2 / h1;

            var discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
            if (discriminant < 0) { // no (real) solution then...
                return;
            }

            var root = Math.sqrt(discriminant);

            var t1 = minusPHalf + root;
            var t2 = minusPHalf - root;

            var tMin = Math.min(t1, t2);
            var tMax = Math.max(t1, t2);

            t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
            if (t < 0) { // we don't want a solution in the past
                return;
            }
        }

        //TODO: Not sure why but I have to cut it in half to actually hit
        t=t*0.5;
        // calculate the point of interception using the found intercept time and return it
        return new Phaser.Math.Vector2(objPos.x + t * objVel.x, objPos.y + t * objVel.y);

    }
}

class Collector extends Ship
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xFF8C00);
        this.type = "Collector";
        this.caught = [];

        this.targetTypes.push('Mineral');
    }

    preUpdate(time,delta)
    {
        this.targets.forEach((obj) => {
            // Stop it in its tracks and let it pull into the collector
            obj.body.setVelocity(0,0);
            obj.setActive(false);
            obj.body.enable = false;
            var vel = new Phaser.Math.Vector2(this.x-obj.x,this.y-obj.y);
            vel.normalize();
            vel.scale(this.body.velocity.length()*0.1,this.body.velocity.length()*0.1);
            obj.x += vel.x*delta/60;
            obj.y += vel.y*delta/60;
            var overlap = new Phaser.Geom.Circle(this.x,this.y,this.body.radius);
            if (Phaser.Geom.Circle.ContainsPoint(overlap,obj))
            {
                this.targets = this.targets.filter((v) => v !== obj);
                spaceObjects = spaceObjects.filter((v) => v !== obj);
                money += obj.mineralType.value;
                obj.destroy();
            }
        });
    }
}

class Shielder extends Ship
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0x0000AA);
        this.type = "Shielder";
        this.empty = false;
        this.rechargeTimer = 0;
    }

    setTarget(target)
    {
        this.target = target;
    }

    preUpdate(time,delta)
    {
        if (this.empty)
        {
            this.rechargeTimer += delta;
            if (this.rechargeTimer >= 2000)
            {
                this.empty = false;
                this.rechargeTimer = 0;
                this.setTexture('Shielder-full');
            }
        }
        this.rotation = Phaser.Math.Angle.BetweenPoints(this,this.target)+3*Math.PI/2;
    }

    takeDamage(damage)
    {
        if (this.destroyed !== undefined && this.durability <= 0)
            this.destroyed(this);
        else
        {
            this.durability -= damage; // TODO: Use mass and speed somehow instead?

            if (this.durability == 0)
            {
                this.setTexture('Shielder-empty');
                this.empty = true;
            }
        }
    }
}

class WeaponPlatform extends Ship
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xAA0000);
        this.type = "WeaponPlatform";
        this.detectionRadius = 200;
        this.targetTypes.push('EnemyRocket');

        this.gun = new Gun(this,500,200);
    }

    preUpdate(time, delta)
    {
        this.gun.update(delta);
        if (this.gun.canFire && this.targets.length > 0)
        {
            var obj = this.getClosestTarget();
            // Get closest target
            if (obj === undefined)
                return;

            var pointOfIntercept = this.getInterceptPoint(obj,this.gun.speed);
            if (pointOfIntercept === undefined)
                return;

            this.gun.takeAShot(pointOfIntercept);
        }
    }
}

class Gun 
{
    constructor(parent,recharge,speed)
    {
        this.parent = parent;
        this.rechargeMax = recharge;
        this.recharge = recharge;
        this.speed = speed;
        this.canFire = false;
    }

    update(delta)
    {
        if (this.canFire == false)
        {
            this.recharge -= delta;
            if (this.recharge <= 0)
            {
                this.recharge = this.rechargeMax;
                this.canFire = true;
            }
        }
    }

    takeAShot(aimPoint)
    {
        var bullet = new Bullet(this.parent.scene,this.parent.x,this.parent.y,'bullet');
        var bulletVel = new Phaser.Math.Vector2(aimPoint.x-this.parent.x,aimPoint.y-this.parent.y);
        bulletVel.normalize();
        bulletVel.scale(this.speed);
        bullet.body.setVelocity(bulletVel.x,bulletVel.y);
        
        // For debugging where it's trying to intercept
        //this.scene.add.circle(pointOfIntercept.x,pointOfIntercept.y,3,0xC0F000,1);
        this.canFire = false;
    }
}

class Bullet extends Phaser.GameObjects.Sprite
{
    constructor(scene,x,y,texture,frame)
    {
        super(scene,x,y,texture,frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(0.1);
        this.type = "Bullet";
        this.life = 5000;
        this.body.mass = 1;
        this.body.radius = 1;
        // TODO: There's got to be an object override collide...
        scene.physics.world.bodies.entries.forEach((v) => {
            if (v.gameObject.type == "EnemyRocket")
            {
                scene.physics.add.overlap(this,v.gameObject,this.overlaps,null,this);
            }
        })
    }

    overlaps(bullet,other)
    {
        other.takeDamage(1);
        bullet.life = 0;
        this.setActive(false);
        this.setVisible(false);
    }

    preUpdate(time,delta)
    {
        this.life-=delta;
        if (this.life<=0)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    fire(x, y)
    {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
    }
}

class Interceptor extends Ship
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0x00AA00);
        this.type = "Interceptor";
        this.detectionRadius = 300;
        this.speed = 300;
        this.targetTypes.push("EnemyRocket");
        this.gun = new Gun(this,100,100);

        this.mode = "idle";
    }

    engage(obj)
    {
        this.originalVelocity = new Phaser.Math.Vector2(this.body.velocity.x,this.body.velocity.y);
        this.originalPosition = new Phaser.Math.Vector2(this.x,this.y);

        this.mode = "engaging";
    }

    preUpdate(time,delta)
    {
        // remove any expired targets
        this.targets = this.targets.filter((t) => {
            return t.active;
        });
        var target;
        if (this.targets.length == 0 && this.mode != "idle")
        {
            this.mode = "returning";
        }
        else
        {
            target = this.targets[0];
        }
        switch(this.mode)
        {
            case "idle":
            {
                // See if we have a target and engage them
                if (this.targets.length > 0)
                {
                    this.engage(this.targets[0]);
                }
                break;
            }
            case "engaging":
            {
                // Flying to engage
                var pointOfIntercept = this.getInterceptPoint(target,this.speed);
                if (pointOfIntercept !== undefined)
                {
                    var newVelocity = new Phaser.Math.Vector2(pointOfIntercept.x-this.x,pointOfIntercept.y-this.y);
                    newVelocity.normalize();
                    newVelocity.scale(this.speed*(delta/60));
                    this.setVelocity(newVelocity.x,newVelocity.y);
                }

                // Fire gun
                this.gun.update(delta);
                if (this.gun.canFire && this.targets.length > 0)
                {
                    var obj = this.getClosestTarget();
                    // Get closest target
                    if (obj === undefined)
                        return;
        
                    var aimPoint = new Phaser.Math.Vector2(obj.x+obj.body.velocity.x,obj.y+obj.body.velocity.y);
                    this.gun.takeAShot(aimPoint);
                }
                break;
            }
            case "returning":
            {
                // Return to position and velocity
                var vel;
                var dist = Phaser.Math.Distance.Between(this.originalPosition.x,this.originalPosition.y,this.x,this.y);
                if (dist <= 1)
                {
                    vel = this.originalVelocity;
                    this.mode = "idle";
                }
                else
                {
                    vel = new Phaser.Math.Vector2(this.originalPosition.x-this.x,this.originalPosition.y-this.y);
                    vel.normalize();
                    vel.scale(this.speed*(delta/60));
                }
                this.setVelocity(vel.x,vel.y);
                break;
            }
        }
    }

    /*
    setVelocity(x,y)
    {
        if (this.mode == "engaging")
        {

        }
        super.setVelocity(x,y);
    }*/
}

class EnemyRocket extends Ship
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.type = "EnemyRocket";
    }

    setTarget(target)
    {
        this.target = target;
    }

    preUpdate(time, delta)
    {

    }
}

class Mineral extends OrbitObject
{
    constructor(scene, x, y, type, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.mineralType = type;
        this.type = "Mineral";
        this.setTint(type.color);
    }

    preUpdate(time, delta)
    {
        // TODO: Run through simulation engine instead to get gravity modifications
        //this.scene.graphics.lineStyle(1,0xff00ff,0.5);
        //var endPoint = this.body.velocity.scale(50,50);
        //graphics.strokeLineShape(new Phaser.Geom.Line(this.x,this.y,endPoint.x,endPoint.y));
    }
}

class MineralType {}
MineralType.Silver = {
    name: "Silver",
    color: 0xC0C0C0,
    value: 50
}
MineralType.Gold = {
    name: "Gold",
    color: 0xD4AF37,
    value: 100
}