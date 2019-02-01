import Phaser from 'phaser'
import OrbitObject from './OrbitObject'

export default class extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        this.type = "Ship";
        this.detectionRadius = 50;
        this.targetTypes = [];
        this.targets = [];
    }

    scanForTarget(objects)
    {
        var detectionArea = new Phaser.Geom.Circle(this.x,this.y,this.detectionRadius);
        objects.forEach((obj) => {
            if (this.targetTypes.filter((type) => type == obj.type).length > 0 
                && Phaser.Geom.Circle.ContainsPoint(detectionArea,new Phaser.Geom.Point(obj.x,obj.y))
                && this.targets.filter((t) => t === obj).length == 0)
            {
                console.log(this.type + " acquired target " + obj.type);
                obj.on("destroy", () => {
                    this.targets = this.targets.filter((o) => { o !== obj });                    
                });
                this.targets.push(obj);
            }
        });
    }

    getClosestTarget() 
    {
        var dist = this.detectionRadius*2;
        var obj = this.targets.filter((v) => {
            var checkDist = Phaser.Math.Distance.Between(v.x,v.y,this.x,this.y)
            if (checkDist <= dist)
            {
                dist = checkDist;
                return true;
            }
            else
            {
                return false;
            }
        })[0];
        return obj;
    }

    getInterceptPoint(obj,speed)
    {
        // Things we know
        var objPos = new Phaser.Math.Vector2(obj.x,obj.y);
        var objVel = new Phaser.Math.Vector2(obj.body.velocity.x,obj.body.velocity.y);
        var thisPos = new Phaser.Math.Vector2(this.x,this.y);
        
        var ox = thisPos.x - objPos.x;
        var oy = thisPos.y - objPos.y;

        var h1 = objVel.x * objVel.x + objVel.y * objVel.y - speed * speed;
        var h2 = ox * objVel.x + oy * objVel.y;
        var t;
        if (h1 == 0) { // problem collapses into a simple linear equation 
            t = -(ox * ox + oy * oy) / (2*h2);
        } else { // solve the quadratic equation
            var minusPHalf = -h2 / h1;

            var discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
            if (discriminant < 0) { // no (real) solution then...
                return;
            }

            var root = Math.sqrt(discriminant);

            var t1 = minusPHalf + root;
            var t2 = minusPHalf - root;

            var tMin = Math.min(t1, t2);
            var tMax = Math.max(t1, t2);

            t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
            if (t < 0) { // we don't want a solution in the past
                return;
            }
        }

        //TODO: Not sure why but I have to cut it in half to actually hit
        t=t*0.5;
        // calculate the point of interception using the found intercept time and return it
        return new Phaser.Math.Vector2(objPos.x + t * objVel.x, objPos.y + t * objVel.y);

    }
}