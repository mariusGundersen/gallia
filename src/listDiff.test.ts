import listDiff from "./listDiff";

function simpleListDiff(a: string[], b: string[]) {
  const changes: string[] = [];
  let index = 0;

  listDiff(
    a.map((key) => ({ key })),
    b.map((key) => ({ key })),
    {
      noop: () => index++,
      insert: ({ key }) => changes.push(`INSERT: ${index++} = ${key}`),
      move: ({ key }) => changes.push(`MOVE: ${index++} = ${key}`),
      remove: ({ key }) => changes.push(`REMOVE: ${index++} = ${key}`),
    }
  );

  return changes;
}

test("same lists", () => {
  const result = simpleListDiff(
    ["A", "B", "C", "D", "E", "F", "G"],
    ["A", "B", "C", "D", "E", "F", "G"]
  );

  expect(result).toEqual([]);
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

  expect(changes).toEqual(["REMOVE: 0 = A", "REMOVE: 5 = F"]);
});

test("create", () => {
  const changes = simpleListDiff([], ["A", "B", "C"]);

  expect(changes).toEqual(["INSERT: 0 = A", "INSERT: 1 = B", "INSERT: 2 = C"]);
});

test("clear", () => {
  const changes = simpleListDiff(["A", "B", "C"], []);

  expect(changes).toEqual(["REMOVE: 0 = A", "REMOVE: 1 = B", "REMOVE: 2 = C"]);
});

test("change first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["MOVE: 0 = G"]);
});

test("change middle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "G", "D", "E", "F"]
  );

  expect(changes).toEqual(["MOVE: 2 = G"]);
});

test("change last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "D", "E", "G"]
  );

  expect(changes).toEqual(["MOVE: 5 = G"]);
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

  expect(changes).toEqual([
    "MOVE: 0 = E",
    "MOVE: 1 = C",
    "MOVE: 2 = F",
    "MOVE: 3 = A",
    "MOVE: 4 = B",
    "MOVE: 5 = D",
  ]);
});

test("move items first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["E", "F", "A", "B", "C", "D"]
  );

  expect(changes).toEqual([
    "MOVE: 0 = E",
    "MOVE: 1 = F",
    "MOVE: 2 = A",
    "MOVE: 3 = B",
    "MOVE: 4 = C",
    "MOVE: 5 = D",
  ]);
});
