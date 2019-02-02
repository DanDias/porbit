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
        this.particles = scene.add.particles('flares');

        this.emitter = this.particles.createEmitter({
            frame: { frames: ['blue'], cycle:true },
            quantity: 4,
            frequency: 50,
            scale: 0.15,
            lifespan: 4000,
            blendMode: 'SCREEN'
        });

        this.emitter.startFollow(this,0,0,true);
    }

    setTarget(target)
    {
        this.target = target;
        this.target.addShielder(this);

        this.particles.createGravityWell({
            x: this.target.x,
            y: this.target.y,
            power: 1,
            gravity: 100
        });

        var circle = new Phaser.Geom.Circle(this.target.x,this.target.y,this.target.body.halfWidth);
        this.emitter.setDeathZone({ type: 'onEnter', source: circle });
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
                this.durability = 1;
                this.target.updateShield(true);
                this.emitter.start();
            }
        }
        this.rotation = Phaser.Math.Angle.BetweenPoints(this,this.target)+3*Math.PI/2;
    }

    takeDamage(damage)
    {
        if (this.destroyed !== undefined && this.durability <= 0)
        {
            this.target.removeShielder(this);
            this.destroyed(this);
        }
        else
        {
            this.durability -= damage; // TODO: Use mass and speed somehow instead?

            if (this.durability == 0)
            {
                this.emitter.stop();
                this.empty = true;
            }
        }
    }
}