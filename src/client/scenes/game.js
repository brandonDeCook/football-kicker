import { Scene } from "phaser";
import Kicker from "../objects/kicker";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("mainBackground", "./assets/main-background-daytime-desktop.png");
    this.load.image("goalPost", "./assets/sprites/goal-post-desktop.png");
    this.load.image("cloudSmall", "./assets/sprites/cloud-small-desktop.png");
    this.load.image("cloudLarge", "./assets/sprites/cloud-large-desktop.png");
    Kicker.preload(this);
  }

  create() {
    Kicker.create(this);
    const { width, height } = this.scale;
    

    this.add.image(width / 2, height / 2, "mainBackground").setOrigin(0.5, 0.5);

    this.cloudSmall1 = this.add.image(-100, 30, "cloudSmall");
    this.cloudSmall1.metaData = { tweenRepeatXPos: -50 };
    this.cloudSmall2 = this.add.image(700, 100, "cloudSmall");
    this.cloudSmall2.metaData = { tweenRepeatXPos: -50 };
    this.cloudLarge1 = this.add.image(200, 60, "cloudLarge");
    this.cloudLarge1.metaData = { tweenRepeatXPos: -100 };

    const addCloudTween = (cloud, duration, endLength) => {
        this.tweens.add({
          targets: cloud,
          x: width + endLength,
          duration,
          ease: 'Linear',
          repeat: -1,
          onRepeat: (tween, target) => {
            tween.data[0].start = target.metaData.tweenRepeatXPos;
            if(tween.data[0].duration == 30000){
                tween.data[0].duration += 54000;
            }
          },
        });
      };

    addCloudTween(this.cloudSmall1, 84000, 50);
    addCloudTween(this.cloudSmall2, 30000, 50);
    addCloudTween(this.cloudLarge1, 70000, 100);

    this.add.image(width / 2, 178, "goalPost").setOrigin(0.5, 0.5);

    this.kicker = new Kicker(this, 75, 550);
    this.kicker.moveToAndKick(350, 500);
  }
}
