export class UIButton extends Phaser.GameObjects.Sprite 
{
    setText(text)
    {
        this.label.text = text;
    }

    constructor(scene, x, y, width, height, text, style) {
        super(scene, x, y, 'ui-button');
        scene.add.existing(this);
        this.setInteractive({ useHandCursor: true });
        this.displayWidth = width;
        this.displayHeight = height;
        this.label = new Phaser.GameObjects.Text(scene, x, y, text, style);
        this.label.setOrigin(0.5);
        this.label.setDepth(10);
        this.setDepth(10);
        scene.add.existing(this.label);
    }

    setSelected(selected, tintColor)
    {
        if (tintColor === undefined) 
            tintColor = 0x00AA00;
        if (selected)
            this.setTint(tintColor);
        else
            this.clearTint();
    }
}

export class FloatingText extends Phaser.GameObjects.Text
{
    constructor(scene, x, y, text, style)
    {
        super(scene,x,y,text,style);
        scene.tweens.add({
            targets: this,
            y: { value: y-150, duration: 300, ease: 'Linear', delay: 1000 },
            alpha: { value: 0, duration: 300, ease: 'EaseOut', delay: 1000 },
            onComplete: this.finishTween
        });
    }

    finishTween(tween, targets)
    {
        //this.destroy();
    }
}

export class FPSCounter
{
    constructor (scene, x, y)
    {
        this.fpsHighText = new Phaser.GameObjects.Text(scene, x, y, "", { fill: '#0A0', fontSize: '10px'} );
        this.fpsActiveText = new Phaser.GameObjects.Text(scene, x, y+10, "", { fill: '#AA0', fontSize: '10px'} );
        this.fpsLowText = new Phaser.GameObjects.Text(scene, x, y+20, "", { fill: '#A00', fontSize: '10px'} );
    
        scene.add.existing(this.fpsHighText);
        scene.add.existing(this.fpsActiveText);
        scene.add.existing(this.fpsLowText);

        this.fpsActiveText.low = 999;
        this.fpsActiveText.high = 0;    
    }

    update(delta,time)
    {
        var fps = Math.round(this.game.loop.actualFps);
        this.fpsActiveText.text = fps;
        if (this.fpsActiveText.high < fps)
            this.fpsActiveText.high = this.fpsHighText.text = fps;
        if (this.fpsActiveText.low > fps)
            this.fpsActiveText.low = this.fpsLowText.text = fps;   
    }
}

export class HealthBar {

    constructor (scene, x, y, startingValue)
    {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x;
        this.y = y;
        this.maxValue = this.value = startingValue;
        this.aThird = startingValue * 0.3;
        this.p = 76 / startingValue;

        this.draw();

        scene.add.existing(this.bar);
    }

    destroy()
    {
        this.bar.destroy();
    }

    decrease (amount)
    {
        this.value -= amount;

        if (this.value < 0)
        {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    draw ()
    {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, 80, 16);

        //  Health

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(this.x + 2, this.y + 2, 76, 12);

        if (this.value < this.aThird)
        {
            this.bar.fillStyle(0xff0000);
        }
        else
        {
            this.bar.fillStyle(0x00ff00);
        }

        var d = Math.floor(this.p * this.value);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 12);
    }
}