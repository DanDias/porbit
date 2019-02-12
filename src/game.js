import Phaser from 'phaser'

import InGameUI from './scenes/InGameUI';
import InGame from './scenes/InGame';

import { FloatingText } from './components/ui'
import Spawner from './components/Spawner';

var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [ InGame, InGameUI ]
};

var game = new Phaser.Game(config);

var spawner = new Spawner();