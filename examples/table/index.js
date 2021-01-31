import { Observable } from "/gallia/main.js";

let idCounter = 1;
const adjectives = [
    "pretty",
    "large",
    "big",
    "small",
    "tall",
    "short",
    "long",
    "handsome",
    "plain",
    "quaint",
    "clean",
    "elegant",
    "easy",
    "angry",
    "crazy",
    "helpful",
    "mushy",
    "odd",
    "unsightly",
    "adorable",
    "important",
    "inexpensive",
    "cheap",
    "expensive",
    "fancy",
  ],
  colours = [
    "red",
    "yellow",
    "blue",
    "green",
    "pink",
    "brown",
    "purple",
    "brown",
    "white",
    "black",
    "orange",
  ],
  nouns = [
    "table",
    "chair",
    "house",
    "bbq",
    "desk",
    "car",
    "pony",
    "cookie",
    "sandwich",
    "burger",
    "pizza",
    "mouse",
    "keyboard",
  ];

function _random(max) {
  return Math.round(Math.random() * 1000) % max;
}

function buildData(count) {
  let data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: idCounter++,
      label: `${adjectives[_random(adjectives.length)]} ${
        colours[_random(colours.length)]
      } ${nouns[_random(nouns.length)]}`,
    };
  }
  return data;
}

export default class index extends Observable {
  list = [];
  selected = -1;

  select(item) {
    this.selected = this.selected === item.id ? -i : item.id;
  }

  remove(item) {
    this.list = this.list.filter((i) => i !== item);
  }

  create() {
    this.list = buildData(1000);
  }

  clear() {
    this.list = [];
  }

  append() {
    window.performance.mark("append");
    this.list = this.list.concat(buildData(1));
  }

  prepend() {
    window.performance.mark("prepend");
    this.list = buildData(1).concat(this.list);
  }

  removeFirst() {
    window.performance.mark("removeFirst");
    this.list = this.list.filter((_, i) => i > 0);
  }

  removeLast() {
    window.performance.mark("removeLast");
    this.list = this.list.filter((_, i, c) => i < c.length - 1);
  }
}
