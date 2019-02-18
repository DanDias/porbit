import Phaser from 'phaser'
import Ship from './Ship'

export default class extends Ship
{
    constructor(scene, x, y, texture, frame)
    {
        super(scene, x, y, 1, texture, frame);
        this.scale = 0.25;
        this.setScale(this.scale);
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