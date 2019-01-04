class UIButton extends Phaser.GameObjects.Sprite 
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
        scene.add.existing(this.label);
    }

    setSelected(selected) 
    {
        if (selected)
            this.setTint(0x990000);
        else
            this.clearTint();
    }
}

class FloatingText extends Phaser.GameObjects.Text
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