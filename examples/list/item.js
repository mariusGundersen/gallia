import { Observable } from "/gallia/main.js";

export default class Item extends Observable {
  time = new Date();
  $mounted() {
    console.log("mounted");
    const intval = setInterval(() => {
      console.log("update time");
      this.time = new Date();
    }, 1000);
    return () => clearInterval(intval);
  }
  $unmounted() {
    console.log("unmounted");
  }
}
