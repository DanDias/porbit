# porbit <font size=1><i>working title</i></font>
## Description
Defend your planet from celestial dangers by purchasing devices and launching them into orbit.

## TODO

### Game Engine Tweaks
* Resize all game elements when game area/window resizes
* Object pooling...
* Find a better way to do object collision events
* CLEAN UP!
### Money Gathering
* Maybe just point asteroid in a random direction on the unit circle with less velocity, to give a better shape to their approach
* Do smarter updates to simulated paths?
* Run asteroids through simulation engine to get a predictable path
### Enemies
* Enemy type: Sin approach
* Enemy type: Far orbit bombard
* Enemy Wave mechanism
### Player Units
* Interceptor object avoidance (planet and target)
* Interceptor rejoin on closest point in original velocity rather than exactly at original position?
* Interceptor fire faster.
* Shielder - Have them provide a full shield to the planet as long as they are in orbit. 1 durability per 2 satellites.
* ~~Interceptor to do it's normal orbit, when it detects something it'll fly out, attack it and then return to the orbit.~~ 
### Planet
* Change planet sprites as duribility degrades
### Systems Design
* Use mass and speed to inflict damage instead of just 1 point every time?
* Planet Durability
* Fail/Win Conditions
* Intercept formula - not sure why but I have to cut it in half to actually hit. And that doesn't work with all speeds. Unit conversion problem?
* ~~Refactor to merge gun functionality~~
* ~~Refactor to merge targetting functionality~~