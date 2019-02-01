import Phaser from 'phaser'
import Bullet from '../spaceobjects/Bullet'

export default class
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