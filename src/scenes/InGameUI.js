import Phaser from 'phaser';
import { UIButton, FloatingText, FPSCounter } from '../components/ui';
import Spawner from '../components/Spawner';

export default class extends Phaser.Scene
{
    constructor()
    {
        super({key: 'InGameUI', active:true});
        this.moneyText = null;
        this.spawner = new Spawner();
        this.spawnButtons = [];
        this.gameOver = false;
    }

    preload()
    {
        this.load.spritesheet('ui-button', 'assets/ui/button.png', { frameWidth: 80, frameHeight: 40});
    }

    update(delta,time)
    {
        this.moneyText.text = "Money: "+this.gameScene.money;
        this.fps.update(delta,time);
    }

    showError(text,pos)
    {
        var error = new FloatingText(this,pos.x,pos.y+30,text, {fill:'#FFF'});
        this.add.existing(error);
    }

    setGameOver(won)
    {
        this.gameOver = true;
        this.spawnButtons.forEach((b) => {
            b.active = false;
        });
        this.gameOverText = new Phaser.GameObjects.Text(this, this.game.config.width/2-35, this.game.config.height/2, won ? "You destroyed all the enemies!" : "Game over, man. Game over.", { fill: '#F00', fontWeight: 'bold' });
        this.add.existing(this.gameOverText);
        this.gameOverButton = new UIButton(this, this.game.config.width/2-80, this.game.config.height/2-25, 160, 50, "Restart", { fill: '#000'});
        var self = this;
        this.gameOverButton.on("pointerdown", function(pointer) {
            window.location = window.location;
        });
    }

    create()
    {
        var config = this.game.config;
        this.gameScene = this.game.scene.getScene('InGame');

        this.moneyText = new Phaser.GameObjects.Text(this, 10, 10, "Money: "+this.gameScene.money, { fill: '#FFF' });
        this.fps = new FPSCounter(this, this.game.config.width-25, 10);

        this.add.existing(this.moneyText);

        var debugBtn = new UIButton(this, this.game.config.width-85, this.game.config.height-25, 160, 50, (this.gameScene.cost ? '' : 'Don\'t\n')+" Enforce Cost", { fill: '#000' });
        var gameScene = this.gameScene;
        debugBtn.on("pointerdown", function(pointer) {
            pointer.event.cancelBubble = true;
            gameScene.cost = !gameScene.cost;
            this.setText((gameScene.cost ? '' : 'Don\'t\n')+" Enforce Cost");
        });

        var xLoc = 75;
        var self = this;
        Object.keys(this.spawner).forEach(function(key) {
            var item = this.spawner[key];
            var btn = new UIButton(this, xLoc, config.height-40, 150, 50, key+"\n$"+item.cost, { fill: '#000' });
            btn.on("pointerdown", function(pointer) {
                if (self.gameOver) { return; }
                self.spawnButtons.forEach((b) => {
                    b.setSelected(false);
                });
                pointer.event.cancelBubble = true;
                self.gameScene.spawnMode = item;
                this.setSelected(true);
            });
            if (self.gameScene.spawnMode === null)
            {
                self.gameScene.spawnMode = item;
                btn.setSelected(true);
            }
            xLoc += 150
            this.spawnButtons.push(btn);
        },this);
    }
}