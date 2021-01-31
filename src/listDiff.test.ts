import listDiff, { Callbacks } from "./listDiff";

function simpleListDiff(a: string[], b: string[]) {
  const listOld = a.map((key) => ({ key }));
  const listCurrent = b.map((key) => ({ key }));

  const changes: string[] = [];
  const result = [...a];
  let index = 0;

  const mapOld = listDiff([], new Map(), listOld, ({
    insert() {},
  } as unknown) as Callbacks<{ key: string }>);

  listDiff(listOld, mapOld, listCurrent, {
    noop({ key }) {
      result[index] = key;
      index++;
    },
    insert({ key }) {
      changes.push(`INSERT: ${index} = ${key}`);
      result.splice(index, 0, key);
      index++;
    },
    move({ key }) {
      changes.push(`MOVE: ${index} = ${key}`);
      result.splice(result.indexOf(key), 1);
      result.splice(index, 0, key);
      index++;
    },
    remove({ key }) {
      changes.push(`REMOVE: ${index} = ${key}`);
      result.splice(index, 1);
    },
  });

  expect(result).toEqual(b);

  return changes;
}

test("same lists", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F", "G"],
    ["A", "B", "C", "D", "E", "F", "G"]
  );

  expect(changes).toEqual([]);
});

test("appended", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "D", "E", "F", "G"]
  );

  expect(changes).toEqual(["INSERT: 6 = G"]);
});

test("prepend", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "A", "B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["INSERT: 0 = G"]);
});

test("insert into middle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "G", "D", "E", "F"]
  );

  expect(changes).toEqual(["INSERT: 3 = G"]);
});

test("append and prepend", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "A", "B", "C", "D", "E", "F", "H"]
  );

  expect(changes).toEqual(["INSERT: 0 = G", "INSERT: 7 = H"]);
});

test("remove last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F", "G"],
    ["A", "B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["REMOVE: 6 = G"]);
});

test("remove first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["REMOVE: 0 = A"]);
});

test("remove from middle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "D", "E", "F"]
  );

  expect(changes).toEqual(["REMOVE: 2 = C"]);
});

test("remove first and last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["B", "C", "D", "E"]
  );

  expect(changes).toEqual(["REMOVE: 0 = A", "REMOVE: 4 = F"]);
});

test("remove first and append", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E"],
    ["B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["REMOVE: 0 = A", "INSERT: 4 = F"]);
});

test("create", () => {
  const changes = simpleListDiff([], ["A", "B", "C"]);

  expect(changes).toEqual(["INSERT: 0 = A", "INSERT: 1 = B", "INSERT: 2 = C"]);
});

test("clear", () => {
  const changes = simpleListDiff(["A", "B", "C"], []);

  expect(changes).toEqual(["REMOVE: 0 = A", "REMOVE: 0 = B", "REMOVE: 0 = C"]);
});

test("change first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["REMOVE: 0 = A", "INSERT: 0 = G"]);
});

test("change middle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "G", "D", "E", "F"]
  );

  expect(changes).toEqual(["REMOVE: 2 = C", "INSERT: 2 = G"]);
});

test("change last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "D", "E", "G"]
  );

  expect(changes).toEqual(["REMOVE: 5 = F", "INSERT: 5 = G"]);
});

test("swap", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "E", "C", "D", "B", "F"]
  );

  expect(changes).toEqual(["MOVE: 1 = E", "MOVE: 4 = B"]);
});

test("shuffle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["E", "C", "F", "A", "B", "D"]
  );

  expect(changes).toEqual(["MOVE: 0 = E", "MOVE: 1 = C", "MOVE: 2 = F"]);
});

test("move one items first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["F", "A", "B", "C", "D", "E"]
  );

  expect(changes).toEqual(["MOVE: 0 = F"]);
});

test("move two items first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["E", "F", "A", "B", "C", "D"]
  );

  expect(changes).toEqual(["MOVE: 0 = E", "MOVE: 1 = F"]);
});

test("move one item last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E"],
    ["A", "C", "D", "E", "B"]
  );

  expect(changes).toEqual(["MOVE: 4 = B"]);
});

test("move two items last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E"],
    ["A", "D", "E", "B", "C"]
  );

  expect(changes).toEqual(["MOVE: 1 = D", "MOVE: 2 = E"]);
});

test("replace item with one from somewhere else", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "F", "C", "D", "E"]
  );

  expect(changes).toEqual(["REMOVE: 1 = B", "MOVE: 1 = F"]);
});

test("replace item with one from somewhere earlier", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "C", "D", "E", "B"]
  );

  expect(changes).toEqual(["REMOVE: 4 = F", "MOVE: 4 = B"]);
});

test("insert a new item and move the existing one somewhere else", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E"],
    ["A", "F", "C", "D", "E", "B"]
  );

  expect(changes).toEqual(["INSERT: 1 = F", "MOVE: 5 = B"]);
});

test("insert a new item and move the existing one somewhere earlier", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E"],
    ["A", "E", "B", "C", "D", "F"]
  );

  expect(changes).toEqual(["MOVE: 1 = E", "INSERT: 5 = F"]);
});
