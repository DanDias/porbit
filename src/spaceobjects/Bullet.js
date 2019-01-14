import Phaser from 'phaser'

export default class extends Phaser.GameObjects.Sprite
{
    constructor(scene,x,y,texture,frame)
    {
        super(scene,x,y,texture,frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(0.1);
        this.type = "Bullet";
        this.life = 5000;
        this.body.mass = 1;
        this.body.radius = 1;
        // TODO: There's got to be an object override collide...
        scene.physics.world.bodies.entries.forEach((v) => {
            if (v.gameObject.type == "EnemyRocket")
            {
                scene.physics.add.overlap(this,v.gameObject,this.overlaps,null,this);
            }
        })
    }

    overlaps(bullet,other)
    {
        other.takeDamage(1);
        bullet.life = 0;
        this.setActive(false);
        this.setVisible(false);
    }

    preUpdate(time,delta)
    {
        this.life-=delta;
        if (this.life<=0)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    fire(x, y)
    {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
    }
}