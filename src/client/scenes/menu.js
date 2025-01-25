import { Scene } from "phaser";

export class Menu extends Scene {
  constructor() {
    super("Menu");
  }

  preload() {
    this.load.plugin(
      "rexinputtextplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexinputtextplugin.min.js",
      true
    );
    this.load.audio("buttonSelect", "assets/sounds/buttonSelect.wav");
    this.load.image("football-mobile", "assets/football-title-mobile.png"); // Load the football image
    this.load.image("football-desktop", "assets/football-title-desktop.png"); // Load the football image
  }

  create() {
    // Hack to make sure fonts & cursor is loaded in
    setTimeout(() => {
      this.delayedCreate();
    }, 1500);
  }

  delayedCreate() {
    const isMobile =
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS ||
      this.sys.game.device.os.iPad ||
      this.sys.game.device.os.iPhone;
    
    const titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      "Football Kicker",
      {
        fontFamily: "title",
        fontSize: "84px",
        color: "#ffffff",
        align: "center",
      }
    );
    titleText.setOrigin(0.5);

    // Add the football image
    const football = this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "football-desktop"
    );
    football.setOrigin(0.5);

    const startButton = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 90,
      "START",
      {
        fontFamily: "standard",
        fontSize: "32px",
        color: "#00b800",
        backgroundColor: "#000000",
        padding: {
          x: 10,
          y: 5,
        },
        align: "center",
      }
    );
    startButton.setOrigin(0.5);
    startButton.setInteractive();
    startButton.on("pointerover", () => {
      startButton.setStyle({ color: "#f8b800" });
    });
    startButton.on("pointerout", () => {
      startButton.setStyle({ color: "#00b800" });
    });
    startButton.on("pointerdown", () => {
      this.sound.play("buttonSelect");
      this.scene.start("Game");
    });
  }
}
