import Phaser from 'phaser';
import { UIButton, FloatingText } from '../components/ui';
import Spawner from '../components/Spawner';

export default class extends Phaser.Scene
{
    constructor()
    {
        super({key: 'InGameUI', active:true});
        this.moneyText = null;
        this.spawner = new Spawner();
        this.spawnButtons = [];
    }

    preload()
    {
        this.load.spritesheet('ui-button', 'assets/ui/button.png', { frameWidth: 80, frameHeight: 40});
    }

    update(delta,time)
    {
        this.moneyText.text = "Money: "+this.gameScene.money;
    }

    showError(text,pos)
    {
        var error = new FloatingText(this,pos.x,pos.y+30,text, {fill:'#FFF'});
        this.add.existing(error);
    }

    create()
    {
        var config = this.game.config;
        this.gameScene = this.game.scene.getScene('InGame');

        this.moneyText = new Phaser.GameObjects.Text(this, 10, 10, "Money: "+this.gameScene.money, { fill: '#FFF' });
        this.add.existing(this.moneyText);

        var debugBtn = new UIButton(this, this.game.config.width-85, this.game.config.height-25, 160, 50, (this.gameScene.cost ? '' : 'Don\'t\n')+" Enforce Cost", { fill: '#000' });
        var gameScene = this.gameScene;
        debugBtn.on("pointerdown", function(pointer) {
            pointer.event.cancelBubble = true;
            gameScene.cost = !gameScene.cost;
            this.setText((gameScene.cost ? '' : 'Don\'t\n')+" Enforce Cost");
        });

        var xLoc = 75;
        Object.keys(this.spawner).forEach(function(key) {
            var item = this.spawner[key];
            var btn = new UIButton(this, xLoc, config.height-40, 150, 50, key+"\n$"+item.cost, { fill: '#000' });
            var me = this;
            btn.on("pointerdown", function(pointer) {
                me.spawnButtons.forEach((b) => {
                    b.setSelected(false);
                });
                pointer.event.cancelBubble = true;
                me.gameScene.spawnMode = item;
                this.setSelected(true);
            });
            if (this.gameScene.spawnMode === null)
            {
                this.gameScene.spawnMode = item;
                btn.setSelected(true);
            }
            xLoc += 150
            this.spawnButtons.push(btn);
        },this);
    }
}