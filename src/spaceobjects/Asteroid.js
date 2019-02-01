import OrbitObject from './OrbitObject'

export default class extends OrbitObject
{
    constructor(scene, x, y, type, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.mineralType = type;
        this.type = "Asteroid";
        this.setTint(type.color);
    }

    preUpdate(time, delta)
    {
        // TODO: Run through simulation engine instead to get gravity modifications
        //this.scene.graphics.lineStyle(1,0xff00ff,0.5);
        //var endPoint = this.body.velocity.scale(50,50);
        //graphics.strokeLineShape(new Phaser.Geom.Line(this.x,this.y,endPoint.x,endPoint.y));
    }
}