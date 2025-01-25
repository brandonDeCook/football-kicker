import { Game } from "./scenes/game";
import { Menu } from "./scenes/menu";
import AwaitLoaderPlugin from "phaser3-rex-plugins/plugins/awaitloader-plugin.js";


const isMobile = /Mobi|Android/i.test(navigator.userAgent);

const config = {
  type: Phaser.AUTO,
  width: isMobile ? 400 : 800,
  height: isMobile ? 300 : 600,

  parent: "game-container",
  dom: {
    createContainer: true,
  },
  backgroundColor: "#000000",

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [Menu, Game],

  plugins: {
    global: [
      {
        key: "rexAwaitLoader",
        plugin: AwaitLoaderPlugin,
        start: true,
      },
    ],
  },
};

export default new Phaser.Game(config);
