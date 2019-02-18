import Phaser from 'phaser'
import Ship from './Ship'

export default class extends Ship
{
    constructor(scene, x, y, texture, frame)
    {
        super(scene, x, y, 1, texture, frame);
        this.scale = 0.25;
        this.setScale(this.scale);
        this.type = "EnemyUFO";
        this.amplitude = 5;
    }

    setTarget(target)
    {
        this.target = target;
    }

    preUpdate(time, delta)
    {
        let dir = new Phaser.Math.Vector2(this.body.velocity.x,this.body.velocity.y);
        dir = dir.normalize();
        let sineMove = new Phaser.Math.Vector2(0,this.amplitude * (Math.sin( time ) / 2 + 0.5));
        this.body.setVelocity(this.body.velocity.x+sineMove.x,this.body.velocity.y+sineMove.y);
    }
}