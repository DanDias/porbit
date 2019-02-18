# porbit <font size=1><i>working title</i></font>
## Description
Defend your planet from celestial dangers by purchasing devices and launching them into orbit.

## TODO

### Game Engine Tweaks
* ~~Resize all game elements when game area/window resizes~~
* UI improvements
    * ~~Create separate scene for UI elements~~ 
    * Automatically scale in a way that makes sense
    * Detect landscape vs. portrait
* Object pooling...
* Find a better way to do object collision events
    * Using physics groups and adding an overlap callback resulted in stuff blowing itself up and way more events than wanted... but seems like the right way. Explore that in the future.
* CLEAN UP!
### Money Gathering
* Maybe just point asteroid in a random direction on the unit circle with less velocity, to give a better shape to their approach
* Do smarter updates to simulated paths?
### Enemies
* Enemy type: Sin approach
* Enemy type: Far orbit bombard
* Enemy Wave mechanism
* Add particle effects on boosting ships
* New Sprites
    * New sprite for Rocket
    * New sprite for UFO
### Player Units
* Interceptor object avoidance (planet and target)
* Interceptor rejoin on closest point in original velocity rather than exactly at original position?
* Interceptor fire faster.
* ~~Shielder - Have them provide a full shield to the planet as long as they are in orbit.~~
* ~~Interceptor to do it's normal orbit, when it detects something it'll fly out, attack it and then return to the orbit.~~ 
* Weapons Platform/Interceptor - Add particle effects on shots
* New Sprites
    * New sprite for Collectors
    * New sprite for Shielder
    * New sprite for Weapons Platform
    * New sprite for Interceptor
### Planet
* Change planet sprites as durability degrades
* takeDamage return remaining damage. When damage is > 1; mostly for planets with shielders
### Systems Design
* ~~FPS counter~~
* ~~Move scale into encapsulated objects~~
* Use mass and speed to inflict damage instead of just 1 point every time?
* Planet Durability
* Fail/Win Conditions
    * Fail if the planet reaches 0 durability
* Intercept formula - not sure why but I have to cut it in half to actually hit. And that doesn't work with all speeds. Unit conversion problem?
* ~~Refactor to merge gun functionality~~
* ~~Refactor to merge targeting functionality~~