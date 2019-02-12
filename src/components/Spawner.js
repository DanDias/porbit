import Collector from '../spaceobjects/Collector'
import Shielder from '../spaceobjects/Shielder'
import WeaponPlatform from '../spaceobjects/WeaponPlatform'
import Interceptor from '../spaceobjects/Interceptor'

export default class
{
    constructor()
    {
        this.Collector = {
            name: "Collector",
            class: Collector,
            cost: 10
        };
        
        this.Shielder = {
            name: "Shielder",
            class: Shielder,
            cost: 50
        };
        
        this.WeaponPlatform = {
            name: "WeaponPlatform",
            class: WeaponPlatform,
            cost: 100
        };

        this.Interceptor = {
            name: "Interceptor",
            class: Interceptor,
            cost: 500
        };
    }
}