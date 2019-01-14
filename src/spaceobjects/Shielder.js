import Phaser from 'phaser'
import Ship from './Ship'

export default class extends Ship
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