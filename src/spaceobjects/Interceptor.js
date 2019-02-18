import Phaser from 'phaser'
import Ship from './Ship'
import Gun from '../components/Gun'

export default class extends Ship
{
    constructor(scene, x, y, texture, frame)
    {
        super(scene, x, y, 1, texture, frame);
        this.setTint(0x00AA00);
        this.scale = 0.25;
        this.setScale(this.scale);
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