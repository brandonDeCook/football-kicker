import Phaser from "phaser";

export default class Kicker extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "footballPlayerIdle", "kicker-idle 0.aseprite");

    scene.add.existing(this);

    this.currentState = null;
    this.setState("idle");
    this.moveTween = null;

    this.sounds = {
      run: scene.sound.add("run", { loop: true }),
      kick: scene.sound.add("kick"),
    };
    this.setDepth(10);
  }

  static preload(scene) {
    const isMobile = false;
      //scene.sys.game.device.os.iOS || scene.sys.game.device.os.android;

    let runImagePath, runJsonPath;
    let idleImagePath, idleJsonPath;
    let kickImagePath, kickJsonPath;

    if (isMobile) {
      runImagePath = "assets/sprites/kicker-run-mobile-sheet.png";
      runJsonPath = "assets/sprites/kicker-run-mobile-sheet.json";
      idleImagePath = "assets/sprites/kicker-idle-mobile-sheet.png";
      idleJsonPath = "assets/sprites/kicker-idle-mobile-sheet.json";
      kickImagePath = "assets/sprites/kicker-kick-mobile-sheet.png";
      kickJsonPath = "assets/sprites/kicker-kick-mobile-sheet.json";
    } else {
      runImagePath = "assets/sprites/kicker-run-desktop-sheet.png";
      runJsonPath = "assets/sprites/kicker-run-desktop-sheet.json";
      idleImagePath = "assets/sprites/kicker-idle-desktop-sheet.png";
      idleJsonPath = "assets/sprites/kicker-idle-desktop-sheet.json";
      kickImagePath = "assets/sprites/kicker-kick-desktop-sheet.png";
      kickJsonPath = "assets/sprites/kicker-kick-desktop-sheet.json";
    }

    scene.load.atlas("footballPlayerRun", runImagePath, runJsonPath);
    scene.load.atlas("footballPlayerIdle", idleImagePath, idleJsonPath);
    scene.load.atlas("footballPlayerKick", kickImagePath, kickJsonPath);

    scene.load.audio("run", "assets/sounds/run.wav");
    scene.load.audio("kick", "assets/sounds/kick.wav");
  }

  static create(scene) {
    scene.anims.create({
      key: "idle",
      frames: scene.anims.generateFrameNames("footballPlayerIdle", {
        start: 0,
        end: 1,
        prefix: "kicker-idle ",
        suffix: ".aseprite",
      }),
      frameRate: 2,
      repeat: -1,
    });

    scene.anims.create({
      key: "run",
      frames: scene.anims.generateFrameNames("footballPlayerRun", {
        start: 0,
        end: 3,
        prefix: "kicker-run ",
        suffix: ".aseprite",
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "kick",
      frames: scene.anims.generateFrameNames("footballPlayerKick", {
        start: 0,
        end: 2,
        prefix: "kicker-kick ",
        suffix: ".aseprite",
      }),
      frameRate: 10,
      repeat: 0,
    });
  }

  setState(newState) {
    if (this.currentState === newState) {
      return;
    }

    if (this.currentState === "run") {
      this.sounds.run.stop();
    }

    this.currentState = newState;

    switch (newState) {
      case "idle":
        this.play("idle");
        break;
      case "run":
        this.sounds.run.play();
        this.play("run");
        break;
      case "kick":
        this.play("kick");
        setTimeout(() => {
          if (this.currentState === "kick") {
            this.sounds.kick.play();
          }
        }, 200);
        break;
      default:
        this.play("idle");
        break;
    }
  }

  moveToAndKick(
    football,
    targetX,
    targetY,
    speed = 100,
    xDrift = 60,
    apexHeight = 400,
    upDuration = 2500,
    downDuration = 2000,
    isFar = true
  ) {
    if (this.moveTween) {
      this.moveTween.stop();
    }

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      targetX,
      targetY
    );
    const duration = (distance / speed) * 1000;

    this.setState("run");

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      onComplete: () => {
        this.setState("kick");

        const onKickFrame = (anim, frame) => {
          if (anim.key === "kick" && frame.index === 3) {
            football.kick(xDrift, apexHeight, upDuration, downDuration, isFar);
            this.off("animationupdate", onKickFrame, this);
          }
        };

        this.on("animationupdate", onKickFrame, this);
        this.once("animationcomplete", () => {
          this.setState("idle");
        });
      },
    });
  }

  update() {}
}
