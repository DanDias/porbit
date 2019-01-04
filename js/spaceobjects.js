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
        this.durability -= damage; // TODO: Use mass and speed somehow instead?
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

class Collector extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xFF8C00);
    }
}

class Shielder extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0x0000AA);
    }
}

class WeaponPlatform extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0xAA0000);
    }
}

class Interceptor extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.setTint(0x00AA00);
    }
}

class EnemyRocket extends OrbitObject
{
    
}