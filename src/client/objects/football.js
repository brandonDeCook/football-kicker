import Phaser from "phaser";

export default class Football extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "footballSpin", "football-spin-medium 0.aseprite");
    scene.add.existing(this);
    this.currentState = null;
    this.setState("football-idle");
  }

  static preload(scene) {
    const isMobile = false;
      //scene.sys.game.device.os.android || scene.sys.game.device.os.iOS;

    let spinMedImagePath;
    let spinMedJsonPath;
    let spinSmallImagePath;
    let spinSmallJsonPath;

    if (isMobile) {
      spinMedImagePath = "assets/sprites/football-spin-medium-mobile-sheet.png";
      spinMedJsonPath = "assets/sprites/football-spin-medium-mobile-sheet.json";
      spinSmallImagePath =
        "assets/sprites/football-spin-small-mobile-sheet.png";
      spinSmallJsonPath =
        "assets/sprites/football-spin-small-mobile-sheet.json";
    } else {
      spinMedImagePath =
        "assets/sprites/football-spin-medium-desktop-sheet.png";
      spinMedJsonPath =
        "assets/sprites/football-spin-medium-desktop-sheet.json";
      spinSmallImagePath =
        "assets/sprites/football-spin-small-desktop-sheet.png";
      spinSmallJsonPath =
        "assets/sprites/football-spin-small-desktop-sheet.json";
    }

    scene.load.atlas("footballSpinMedium", spinMedImagePath, spinMedJsonPath);
    scene.load.atlas(
      "footballSpinSmall",
      spinSmallImagePath,
      spinSmallJsonPath
    );
  }

  static create(scene) {
    scene.anims.create({
      key: "football-idle",
      frames: [
        { key: "footballSpinMedium", frame: "football-spin-medium 0.aseprite" },
      ],
      frameRate: 4,
      repeat: -1,
    });
    scene.anims.create({
      key: "football-spin-medium",
      frames: scene.anims.generateFrameNames("footballSpinMedium", {
        start: 0,
        end: 7,
        prefix: "football-spin-medium ",
        suffix: ".aseprite",
      }),
      frameRate: 6,
      repeat: -1,
    });
    scene.anims.create({
      key: "football-spin-small",
      frames: scene.anims.generateFrameNames("footballSpinSmall", {
        start: 0,
        end: 7,
        prefix: "football-spin-small ",
        suffix: ".aseprite",
      }),
      frameRate: 6,
      repeat: -1,
    });
  }

  setState(newState) {
    if (this.currentState === newState) {
      return;
    }

    this.currentState = newState;

    switch (newState) {
      case "idle":
        this.play("football-idle");
        this.currentState = "idle";
        break;
      case "spin-med":
        this.play("football-spin-medium");
        this.currentState = "spin-med";
        break;
      case "spin-small":
        this.play("football-spin-small");
        this.currentState = "spin-small";
        break;
      default:
        this.play("football-idle");
        this.currentState = "idle";
        break;
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if ((this.currentState == "spin-small") & (this.y >= 280)) {
      this.destroy();
    }
  }

  kick(xDrift, apexHeight, upDuration, downDuration, isFar) {
    const startX = this.x;
    const startY = this.y;

    this.scene.tweens.chain({
      tweens: [
        {
          targets: this,
          x: startX + xDrift * 0.5,
          y: startY - apexHeight,
          duration: upDuration,
          ease: "Power0",
          onStart: () => {
            this.setState("spin-med");
            this.setDepth(6);
          },
        },
        {
          targets: this,
          x: startX + xDrift,
          y: startY,
          duration: downDuration,
          ease: "Linear",
          onStart: () => {
            this.setState(isFar ? "spin-small" : "spin-med");
            this.setDepth(isFar ? 3 : 6);
          },
        },
      ],
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
