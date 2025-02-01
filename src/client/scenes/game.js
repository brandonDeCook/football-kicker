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

    Kicker.preload(this);
    Football.preload(this);

    this.state = "ready";
    this.kickInProgressDuration = 6700;

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

    this.setupInput();
  }

  update(time, delta) {
    if (this.state === "kickInProgress" && !this.footballInGoal && this.football) {
      if (this.football.y > this.prevFootballY) {
        const goalLeft = this.goalPost.x - this.goalPost.displayWidth / 2;
        const goalRight = this.goalPost.x + this.goalPost.displayWidth / 2;
        const goalTop = this.goalPost.y - this.goalPost.displayHeight / 2;
        const goalBottom = this.goalPost.y + this.goalPost.displayHeight / 2;
  
        if (
          this.football.x > goalLeft &&
          this.football.x < goalRight &&
          this.football.y > goalTop &&
          this.football.y < goalBottom
        ) {
          this.footballInGoal = true;
          console.log("Goal scored!");
        }
      }
  
      this.prevFootballY = this.football.y;
    }
  }  

  createBackground(width, height) {
    this.add
      .image(width / 2, height / 2, "mainBackground")
      .setOrigin(0.5, 0.5);
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
      const cloud = this.add.image(cloudConfig.x, cloudConfig.y, cloudConfig.key);
      cloud.metaData = cloudConfig.meta;
      this.animateCloud(cloud, cloudConfig.tweenDuration, cloudConfig.endXOffset, sceneWidth);
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
    this.createAccuracyBar(625, 265, 20, 8, 20, 20);
    this.createPowerBar(705, 240, 20, 20, 8, 15);
    this.powerBar.animation.paused = true;

    this.goalPost = this.add
      .image(sceneWidth / 2, 178, "goalPost")
      .setOrigin(0.5, 0.5);
    this.goalPost.setDepth(5);
  }

  createAccuracyBar(x, y, numBars, barWidth, barHeight, delay) {
    this.accuracyBar.bars = [];
    const barContainer = this.add.container(x, y);

    for (let i = 0; i < numBars; i++) {
      const bar = this.add.rectangle(
        i * barWidth,
        0,
        barWidth - 2,
        barHeight,
        0x000000
      );
      this.accuracyBar.bars.push(bar);
      barContainer.add(bar);
    }

    this.animateAccuracyBars(delay);
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

  createPowerBar(x, y, numBars, barWidth, barHeight, delay) {
    const barContainer = this.add.container(x, y);

    for (let i = 0; i < numBars; i++) {
      const bar = this.add.rectangle(
        0,
        -i * barHeight,
        barWidth - 2,
        barHeight - 2,
        0x000000
      );
      this.powerBar.bars.push(bar);
      barContainer.add(bar);
    }

    this.animatePowerBars(delay);
  }

  animatePowerBars(delay) {
    this.powerBar.buildingUp = true;
    this.powerBar.currentIndex = 0;

    this.powerBar.animation = this.time.addEvent({
      delay: delay,
      loop: true,
      callback: () => {
        if (this.powerBar.buildingUp) {
          this.powerBar.bars[this.powerBar.currentIndex].fillColor = 0xffffff;
          this.powerBar.currentIndex++;

          if (this.powerBar.currentIndex >= this.powerBar.bars.length) {
            this.powerBar.buildingUp = false;
            this.powerBar.currentIndex = this.powerBar.bars.length - 1;
          }
        } else {
          this.powerBar.bars[this.powerBar.currentIndex].fillColor = 0x000000;
          this.powerBar.currentIndex--;

          if (this.powerBar.currentIndex < 0) {
            this.powerBar.buildingUp = true;
            this.powerBar.currentIndex = 0;
          }
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

      this.kicker.moveToAndKick(
        this.football,
        350,
        500,
        100,
        60,
        400,
        2500,
        2000
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

    this.prevFootballY = this.football.y;
    this.footballInGoal = false;
    this.state = "ready";
    this.accuracyBar.animation.paused = false;
    this.powerBar.bars.forEach((bar) => {
      bar.fillColor = 0x000000;
    });
  }
}
