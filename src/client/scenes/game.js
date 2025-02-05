import { Scene } from "phaser";
import Kicker from "../objects/kicker";
import Football from "../objects/football";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  preload() {
    this.load.image(
      "mainBackground",
      "./assets/main-background-daytime-desktop.png"
    );
    this.load.image("goalPost", "./assets/sprites/goal-post-desktop.png");
    this.load.image("cloudSmall", "./assets/sprites/cloud-small-desktop.png");
    this.load.image("cloudLarge", "./assets/sprites/cloud-large-desktop.png");

    this.load.audio("barPause", "assets/sounds/barPause.wav");
    this.load.audio("refWhistle", "assets/sounds/refWhistle.wav");
    this.load.audio("goal", "assets/sounds/goal.wav");

    Kicker.preload(this);
    Football.preload(this);

    this.state = "ready";
    this.kickInProgressDuration = 6700;
    this.debug = false;

    this.accuracyBar = { animation: null, bars: [], currentSelectedIndex: 0 };
    this.powerBar = {
      animation: null,
      bars: [],
      buildingUp: true,
      currentIndex: 0,
    };
  }

  create() {
    Kicker.create(this);
    Football.create(this);

    const { width, height } = this.scale;

    this.initialKickerPosition = { x: 75, y: 550 };
    this.initialFootballPosition = { x: 350, y: 500 };

    this.createBackground(width, height);
    this.createClouds(width);
    this.createUI(width);
    this.createGameObjects();

    this.score = 0;
    this.scoreAdded = false;

    const padding = 10;
    this.scoreText = this.add
      .text(width - padding, padding, `Score: ${this.score}`, {
        fontFamily: "standard",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(1, 0);

    this.input.enabled = false;

    let countdownValue = 3;
    this.countdownText = this.add
      .text(width / 2, height / 2, countdownValue, {
        fontFamily: "standard",
        fontSize: "64px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(7);

    this.time.addEvent({
      delay: 1300,
      repeat: 2,
      callback: () => {
        countdownValue--;

        if (countdownValue == 0) {
          this.countdownText.destroy();
          this.input.enabled = true;
          this.sound.play("refWhistle");
        } else {
          this.countdownText.setText(countdownValue);
        }
      },
      callbackScope: this,
    });

    this.setupInput();
  }

  update(time, delta) {
    if (
      this.state === "kickInProgress" &&
      !this.footballInGoal &&
      this.football
    ) {
      if (this.football.y > this.prevFootballY) {
        let goalLeft = this.goalPost.x - this.goalPost.displayWidth / 2 + 8;
        let goalRight = this.goalPost.x + this.goalPost.displayWidth / 2 - 8;
        let goalTop = this.goalPost.y - this.goalPost.displayHeight / 2;
        let goalBottom =
          this.goalPost.y + this.goalPost.displayHeight / 2 - 90;

        if (this.debug) {
          this.goalDebugGraphics.clear();
          this.goalDebugGraphics.lineStyle(2, 0xff0000, 0.7);
          this.goalDebugGraphics.strokeRect(
            goalLeft,
            goalTop,
            goalRight - goalLeft,
            goalBottom - goalTop
          );
        }

        if (
          this.football.x > goalLeft &&
          this.football.x < goalRight &&
          this.football.y > goalTop &&
          this.football.y < goalBottom
        ) {
          this.footballInGoal = true;
          if (!this.scoreAdded) {
            const kickScore = Math.round(
              this.lastKickPowerRatio * (1 - this.lastKickErrorImpact) * 100
            );
            this.score += kickScore;
            this.scoreText.setText(`Score: ${this.score}`);
            this.scoreAdded = true;
            console.log(`Goal scored! +${kickScore} points`);
            this.sound.play("goal");

            const goalX = this.goalPost.x;
            const goalY =
              this.goalPost.y - this.goalPost.displayHeight / 2 - 10;

            const goalText = this.add
              .text(goalX, goalY, "GOAL SCORED!", {
                fontFamily: "standard",
                fontSize: "24px",
                color: "#ffffff",
              })
              .setOrigin(0.5)
              .setDepth(8);

            const flashEvent = this.time.addEvent({
              delay: 100,
              loop: true,
              callback: () => {
                if (goalText.style.color === "#ffffff") {
                  goalText.setColor("#000000");
                } else {
                  goalText.setColor("#ffffff");
                }
              },
            });

            this.time.delayedCall(1500, () => {
              flashEvent.remove();
              goalText.destroy();
            });
          }
        }
      }
      this.prevFootballY = this.football.y;
    }
  }

  createBackground(width, height) {
    this.add.image(width / 2, height / 2, "mainBackground").setOrigin(0.5, 0.5);
  }

  createClouds(sceneWidth) {
    const clouds = [
      {
        key: "cloudSmall",
        x: -100,
        y: 30,
        tweenDuration: 84000,
        endXOffset: 50,
        meta: { tweenRepeatXPos: -50 },
      },
      {
        key: "cloudSmall",
        x: 700,
        y: 100,
        tweenDuration: 30000,
        endXOffset: 50,
        meta: { tweenRepeatXPos: -50 },
      },
      {
        key: "cloudLarge",
        x: 200,
        y: 60,
        tweenDuration: 70000,
        endXOffset: 100,
        meta: { tweenRepeatXPos: -100 },
      },
    ];

    clouds.forEach((cloudConfig) => {
      const cloud = this.add.image(
        cloudConfig.x,
        cloudConfig.y,
        cloudConfig.key
      );
      cloud.metaData = cloudConfig.meta;
      this.animateCloud(
        cloud,
        cloudConfig.tweenDuration,
        cloudConfig.endXOffset,
        sceneWidth
      );
    });
  }

  animateCloud(cloud, duration, endXOffset, sceneWidth) {
    this.tweens.add({
      targets: cloud,
      x: sceneWidth + endXOffset,
      duration: duration,
      ease: "Linear",
      repeat: -1,
      onRepeat: (tween, target) => {
        tween.data[0].start = target.metaData.tweenRepeatXPos;
        if (tween.data[0].duration === 30000) {
          tween.data[0].duration += 54000;
        }
      },
    });
  }

  createUI(sceneWidth) {
    const barHeight = 20;

    const accuracyBarBottomY = 285;
    const accuracyBarX = 625;
    const accuracyBarY = accuracyBarBottomY - barHeight;
    const accuracyBarConfig = this.createBar(
      accuracyBarX,
      accuracyBarY,
      21,
      8,
      barHeight,
      "Accuracy"
    );
    this.accuracyBar.bars = accuracyBarConfig.bars;
    this.animateAccuracyBars(20);

    const powerBarBottomY = accuracyBarBottomY - 35;
    const powerBarX = 625;
    const powerBarY = powerBarBottomY - barHeight;
    const powerBarConfig = this.createBar(
      powerBarX,
      powerBarY,
      21,
      8,
      barHeight,
      "Power"
    );
    this.powerBar.bars = powerBarConfig.bars;
    this.animatePowerBars(15);
    this.powerBar.animation.paused = true;

    this.goalPost = this.add
      .image(sceneWidth / 2, 178, "goalPost")
      .setOrigin(0.5, 0.5);
    this.goalPost.setDepth(5);

    this.goalDebugGraphics = this.add.graphics();
    this.goalDebugGraphics.setDepth(6);
  }

  createBar(x, y, numBars, segmentWidth, segmentHeight, labelText) {
    const container = this.add.container(x, y);
    let bars = [];
    for (let i = 0; i < numBars; i++) {
      const rect = this.add.rectangle(
        i * segmentWidth,
        0,
        segmentWidth - 2,
        segmentHeight,
        0x000000
      );
      bars.push(rect);
      container.add(rect);
    }

    const labelX = x - 3;
    const labelY = y + segmentHeight - 8;
    const label = this.add.text(labelX, labelY, labelText, {
      fontFamily: "standard",
      fontSize: "12px",
      color: "#ffffff",
    });
    label.setOrigin(0, 0);

    return { container, bars };
  }

  animateAccuracyBars(delay) {
    let index = 0;
    let direction = 1;

    this.accuracyBar.animation = this.time.addEvent({
      delay: delay,
      loop: true,
      callback: () => {
        if (direction === 1) {
          if (index > 0) {
            this.accuracyBar.bars[index - 1].fillColor = 0x000000;
          }
          if (index < this.accuracyBar.bars.length) {
            this.accuracyBar.bars[index].fillColor = 0xffffff;
            this.accuracyBar.currentSelectedIndex = index;
            index++;
          } else {
            direction = -1;
            index = this.accuracyBar.bars.length - 1;
          }
        } else {
          if (index < this.accuracyBar.bars.length - 1) {
            this.accuracyBar.bars[index + 1].fillColor = 0x000000;
          }
          if (index >= 0) {
            this.accuracyBar.bars[index].fillColor = 0xffffff;
            this.accuracyBar.currentSelectedIndex = index;
            index--;
          } else {
            direction = 1;
            index = 0;
          }
        }
      },
    });
  }

  animatePowerBars(delay) {
    this.powerBar.buildingUp = true;
    this.powerBar.currentIndex = 0;

    this.powerBar.animation = this.time.addEvent({
      delay: delay,
      loop: true,
      callback: () => {
        if (this.powerBar.buildingUp) {
          this.powerBar.currentIndex++;
          if (this.powerBar.currentIndex >= this.powerBar.bars.length) {
            this.powerBar.currentIndex = this.powerBar.bars.length;
            this.powerBar.buildingUp = false;
          }
        } else {
          this.powerBar.currentIndex--;
          if (this.powerBar.currentIndex <= 0) {
            this.powerBar.currentIndex = 0;
            this.powerBar.buildingUp = true;
          }
        }

        for (let i = 0; i < this.powerBar.bars.length; i++) {
          this.powerBar.bars[i].fillColor =
            i < this.powerBar.currentIndex ? 0xffffff : 0x000000;
        }
      },
    });
  }

  createGameObjects() {
    this.football = new Football(
      this,
      this.initialFootballPosition.x,
      this.initialFootballPosition.y
    );
    this.kicker = new Kicker(
      this,
      this.initialKickerPosition.x,
      this.initialKickerPosition.y
    );

    this.footballInGoal = false;
    this.prevFootballY = this.football.y;
  }

  setupInput() {
    this.input.on("pointerdown", this.handlePointerDown, this);
  }

  handlePointerDown() {
    if (this.state === "kickInProgress") {
      return;
    }

    if (this.state === "ready") {
      this.sound.play("barPause");
      this.accuracyBar.animation.paused = true;
      this.powerBar.animation.paused = false;
      this.state = "selectPower";
    } else if (this.state === "selectPower") {
      this.state = "kickInProgress";
      this.sound.play("barPause");
      this.powerBar.animation.paused = true;

      const power = this.powerBar.currentIndex;
      const maxPower = this.powerBar.bars.length;
      const powerRatio = power / maxPower;

      const numAccuracyBars = this.accuracyBar.bars.length;
      const midIndex = Math.floor(numAccuracyBars / 2);
      const accuracyDifference = Math.abs(
        this.accuracyBar.currentSelectedIndex - midIndex
      );
      const errorRatio = accuracyDifference / midIndex;
      const errorImpact = errorRatio * errorRatio;

      this.lastKickPowerRatio = powerRatio;
      this.lastKickErrorImpact = errorImpact;

      const baseXDrift = 60;
      const driftMultiplier = 35;
      let xDrift = baseXDrift * (1 + errorImpact * driftMultiplier);
      if (this.accuracyBar.currentSelectedIndex < midIndex) {
        xDrift = xDrift * -1;
      }

      const baseApexHeight = 400;
      const apexHeight = baseApexHeight * (0.5 + powerRatio);

      const baseUpDuration = 2000;
      const baseDownDuration = 2500;
      const upDuration = baseUpDuration * (0.8 + powerRatio * 0.4);
      const downDuration = baseDownDuration * (0.8 + powerRatio * 0.4);

      const speed = 100;
      const targetX = 350;
      const targetY = 500;

      this.kicker.moveToAndKick(
        this.football,
        targetX,
        targetY,
        speed,
        xDrift,
        apexHeight,
        upDuration,
        downDuration
      );

      this.time.delayedCall(
        this.kickInProgressDuration,
        this.resetKick,
        [],
        this
      );
    }
  }

  resetKick() {
    this.kicker.setPosition(
      this.initialKickerPosition.x,
      this.initialKickerPosition.y
    );
    this.football = new Football(
      this,
      this.initialFootballPosition.x,
      this.initialFootballPosition.y
    );

    const sceneWidth = this.scale.width;
    const minX = 100;
    const maxX = sceneWidth - 100;
    const randomX = Phaser.Math.Between(minX, maxX);

    this.goalPost.setPosition(randomX, 178);

    this.prevFootballY = this.football.y;
    this.footballInGoal = false;
    this.state = "ready";
    this.accuracyBar.animation.paused = false;
    this.powerBar.bars.forEach((bar) => {
      bar.fillColor = 0x000000;
    });

    this.scoreAdded = false;
  }
}
