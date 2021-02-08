import { Observable } from "/gallia/main.js";

let id = 0;

export default class List extends Observable {
  list = [];

  add() {
    this.list = [...this.list, { id: id++ }];
  }

  remove(index) {
    console.log("remove", index);
    this.list = this.list.filter((_, i) => i !== index);
  }
}
