class OrbitObject extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.mass = mass;
        this.body.radius = this.width*0.5;

        this.durability = 1;
    }

    setScale(scale)
    {
        super.setScale(scale);
        this.body.radius = this.width*0.5*scale;
    }

    onDestroyed(callback)
    {
        this.destroyed = callback;
    }

    takeDamage(damage)
    {
        this.durability -= damage; // TODO: Use mass somehow instead?
        if (this.destroyed !== undefined && this.durability <= 0)
            this.destroyed(this);
    }
}

class Planet extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        // TODO: realistic duribility
        this.durability = 999999999999999999999999;
    }
}

class Satellite extends OrbitObject
{

}

class EnemyRocket extends OrbitObject
{
    
}