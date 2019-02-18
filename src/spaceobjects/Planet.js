import OrbitObject from './OrbitObject'
import { HealthBar } from '../components/ui';

export default class extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.durability = 10;
        this.scale = 1;
        this.setScale(this.scale);
        this.type = "Planet";
        this.hp = new HealthBar(scene, x-this.width*0.38, y-this.height*0.9, this.durability);

        this.shielders = [];
        this.particles = scene.add.particles('flares');

        var shape = new Phaser.Geom.Circle(x, y, this.body.halfWidth);

        this.shields = this.particles.createEmitter({
            frame: { frames: ['blue'], cycle:true },
            frequency: 1,
            scale: { start: 0.3, end: 0.05},
            blendMode: 'ADD',
            emitZone: { type: 'edge', source: shape, quantity: 60, yoyo: false}
        });
        this.shields.stop();
    }

    updateShield()
    {
        var availableShields = this.shielders.filter(val => !val.empty );
        if (availableShields.length == 0 && this.shields.on)
        {
            this.shields.killAll();
            this.shields.stop();
        }
        else if (availableShields.length > 0 && !this.shields.on)
            this.shields.start();
    }

    addShielder(shielder)
    {
        this.shielders.push(shielder);
        this.updateShield();
    }

    removeShielder(shielder)
    {
        this.shielders = this.shielders.filter(val => val !== shielder );
        this.updateShield();
    }

    takeDamage(damage)
    {
        var availableShields = this.shielders.filter(val => !val.empty );
        if (availableShields.length > 0)
        {
            // TODO: Return damage available?
            availableShields[0].takeDamage(damage);
        }
        else
        {
            super.takeDamage(damage);
            this.hp.decrease(damage);
            if (this.durability <= 0)
                this.hp.destroy();
        }
        this.updateShield();
    }
}