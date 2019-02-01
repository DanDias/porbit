import Phaser from 'phaser'
import Ship from './Ship'

export default class extends Ship
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