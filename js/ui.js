class UIButton extends Phaser.GameObjects.Sprite {
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
}