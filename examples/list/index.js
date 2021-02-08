import { Observable } from "/gallia/main.js";

export default class List extends Observable {
  list = [];

  add() {
    this.list = [...this.list, { id: Math.random() }];
  }

  remove(index) {
    this.list = this.list.filter((_, i) => i !== index);
  }
}
