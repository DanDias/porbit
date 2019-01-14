import Phaser from 'phaser'
import Ship from './Ship'

export default class extends Ship
{
    constructor(scene, x, y, mass, texture, frame, collectCallback)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xFF8C00);
        this.type = "Collector";
        this.caught = [];

        this.collectCallback = collectCallback;
        this.targetTypes.push('Asteroid');
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
                if (this.collectCallback !== undefined)
                    this.collectCallback(obj);
            }
        });
    }
}