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

class Collector extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xFF8C00);
        this.type = "Collector";
    }
}

class Shielder extends OrbitObject
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

class WeaponPlatform extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xAA0000);
        this.type = "WeaponPlatform";
        this.bulletSpeed = 200;
        this.recharge = 500;
        this.canFire = true;
        this.detectionRadius = 200;
    }

    scanForTarget(objects)
    {
        var detectionArea = new Phaser.Geom.Circle(this.x,this.y,this.detectionRadius);
        objects.forEach((obj) => {
            if (obj.type === 'EnemyRocket' 
                && Phaser.Geom.Circle.ContainsPoint(detectionArea,new Phaser.Geom.Point(obj.x,obj.y)))
            {
                this.aimAndFire(obj);
            }
        });
    }

    aimAndFire(obj)
    {
        if (this.canFire)
        {
            // Things we know
            var objPos = new Phaser.Math.Vector2(obj.x,obj.y);
            var objVel = new Phaser.Math.Vector2(obj.body.velocity.x,obj.body.velocity.y);
            var thisPos = new Phaser.Math.Vector2(this.x,this.y);
            
            var ox = thisPos.x - objPos.x;
            var oy = thisPos.y - objPos.y;
    
            var h1 = objVel.x * objVel.x + objVel.y * objVel.y - this.bulletSpeed * this.bulletSpeed;
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
            var pointOfIntercept = new Phaser.Math.Vector2(objPos.x + t * objVel.x, objPos.y + t * objVel.y);


            var bullet = new Bullet(this.scene,thisPos.x,thisPos.y,'bullet');
            var bulletVel = new Phaser.Math.Vector2(pointOfIntercept.x-thisPos.x,pointOfIntercept.y-thisPos.y);
            bulletVel.normalize();
            bulletVel.scale(this.bulletSpeed);
            bullet.body.setVelocity(bulletVel.x,bulletVel.y);
            
            // For debugging where it's trying to intercept
            //this.scene.add.circle(pointOfIntercept.x,pointOfIntercept.y,3,0xC0F000,1);
            this.canFire = false;
        }
    }

    preUpdate(time, delta)
    {
        if (this.canFire == false)
        {
            this.recharge -= delta;
            if (this.recharge <= 0)
            {
                this.recharge = 500;
                this.canFire = true;
            }
        }
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
                scene.physics.add.overlap(this,v.gameObject,this.checkOverlap,null,this);
            }
        })
    }

    checkOverlap(bullet,other)
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

class Interceptor extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0x00AA00);
        this.type = "Interceptor";
    }
}

class EnemyRocket extends OrbitObject
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