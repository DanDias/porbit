class Sim
{
    constructor(scene)
    {
        this.scene = scene;
        this.physics = scene.physics;
    }

    accelerateToObject(gameObject,to,speed)
    {
        if (!gameObject.body.active) { return; }
        var angle = Math.atan2(to.y - gameObject.y, to.x - gameObject.x);

        gameObject.body.acceleration.setToPolar(angle, speed);
        
        return angle;
    }

    // Returns false if the simulation ends before the scheduled end. (crashes)
    simulateUpdate(obj, otherObjects, delta) {
        if (delta===undefined) { delta = 0.1; }
        obj.body.acceleration.setTo(0, 0);
        //Loop around all other objects
        otherObjects.forEach(function(item) {
            var ax = item.body.acceleration.x;
            var ay = item.body.acceleration.y;
            var dx = item.x - item.x;
            var dy = item.y - item.y;
            var r = dx * dx + dy * dy;
            if (r > obj.body.radius * obj.body.radius) {       
                //The force on a body is (body.mass)/r^2 so taking every non planet body with
                // mass=1 the acceleration = force,  (r is already squared save us a sqrt)
                accelerateToObject(item, obj, ((obj.body.mass) / r));
                
                ax = ax + item.body.acceleration.x;
                ay = ay + item.body.acceleration.y;
                item.body.acceleration.setTo(ax, ay);
            }
            else
            {
                return false;
            }
        });
        //Accelerate to planet
        var ax = obj.body.acceleration.x;
        var ay = obj.body.acceleration.y;
        var dx = obj.x - planet.x;
        var dy = obj.y - planet.y;     
        var r = dx * dx + dy * dy;
        if (r < planet.body.radius * planet.body.radius) { //|| (r > killRadius * killRadius)) {       
            return false;
        } else {
            accelerateToObject(obj, planet, (planet.body.mass / r));
            ax = ax + obj.body.acceleration.x;       
            ay = ay + obj.body.acceleration.y;       
            obj.body.acceleration.setTo(ax, ay);
        }
        computeVelocity(obj.body,delta);
        return true;
    }

    computeVelocity(body, delta)
    {
        var velocityX = body.velocity.x;
        var accelerationX = body.acceleration.x;
        var dragX = body.drag.x;
        var maxX = body.maxVelocity.x;

        var velocityY = body.velocity.y;
        var accelerationY = body.acceleration.y;
        var dragY = body.drag.y;
        var maxY = body.maxVelocity.y;

        var speed = body.speed;
        var allowDrag = body.allowDrag;
        var useDamping = body.useDamping;

        if (body.allowGravity)
        {
            var gravX = config.physics.arcade.gravity.x ? config.physics.arcade.gravity.x : 0;
            var gravY = config.physics.arcade.gravity.y ? config.physics.arcade.gravity.y : 0;
            velocityX += (gravX + body.gravity.x) * delta;
            velocityY += (gravY + body.gravity.y) * delta;
        }

        if (accelerationX)
        {
            velocityX += accelerationX * delta;
        }
        else if (allowDrag && dragX)
        {
            if (useDamping)
            {
                //  Damping based deceleration
                velocityX *= dragX;

                if (FuzzyEqual(speed, 0, 0.001))
                {
                    velocityX = 0;
                }
            }
            else
            {
                //  Linear deceleration
                dragX *= delta;

                if (FuzzyGreaterThan(velocityX - dragX, 0, 0.01))
                {
                    velocityX -= dragX;
                }
                else if (FuzzyLessThan(velocityX + dragX, 0, 0.01))
                {
                    velocityX += dragX;
                }
                else
                {
                    velocityX = 0;
                }
            }
        }

        if (accelerationY)
        {
            velocityY += accelerationY * delta;
        }
        else if (allowDrag && dragY)
        {
            if (useDamping)
            {
                //  Damping based deceleration
                velocityY *= dragY;

                if (FuzzyEqual(speed, 0, 0.001))
                {
                    velocityY = 0;
                }
            }
            else
            {
                //  Linear deceleration
                dragY *= delta;

                if (FuzzyGreaterThan(velocityY - dragY, 0, 0.01))
                {
                    velocityY -= dragY;
                }
                else if (FuzzyLessThan(velocityY + dragY, 0, 0.01))
                {
                    velocityY += dragY;
                }
                else
                {
                    velocityY = 0;
                }
            }
        }

        velocityX = Phaser.Math.Clamp(velocityX, -maxX, maxX);
        velocityY = Phaser.Math.Clamp(velocityY, -maxY, maxY);

        body.velocity.set(velocityX, velocityY);
    }
}