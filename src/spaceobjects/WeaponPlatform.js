import Phaser from 'phaser'
import Ship from './Ship'
import Gun from '../components/Gun'

export default class extends Ship
{
    constructor(scene, x, y, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.scale = 0.25;
        this.setScale(this.scale);
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