import Phaser from 'phaser';

export default class extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.mass = mass;
        this.setScale(1);

        this.durability = 1;
        this.type = "OrbitObject";
    }

    setScale(scale)
    {
        super.setScale(scale);
        this.body.radius = this.width*0.5*scale;
    }

    setVelocity(x,y)
    {
        this.body.velocity.setTo(x,y);
    }

    onDestroyed(callback)
    {
        this.destroyed = callback;
    }

    onCollide(callback)
    {
        this.collision = callback;
    }

    doCollision(other)
    {
        if (this.collision !== undefined)
            this.collision(other);
    }

    takeDamage(damage)
    {
        this.durability -= damage; // TODO: Use mass and speed somehow instead?
        if (this.destroyed !== undefined && this.durability <= 0)
            this.destroyed(this);
    }
}