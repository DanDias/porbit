import OrbitObject from './OrbitObject'

export default class extends OrbitObject
{
    constructor(scene, x, y, mass, texture, frame)
    {
        super(scene, x, y, mass, texture, frame);
        // TODO: realistic duribility
        this.durability = 999999999999999999999999;
        this.type = "Planet";
    }
}