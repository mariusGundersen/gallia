import listDiff from "./listDiff";

function simpleListDiff(a: string[], b: string[]) {
  const changes: string[] = [];

  listDiff(
    a.map((key) => ({ key })),
    b.map((key) => ({ key })),
    (change, index, { key }) => changes.push(`${change}: ${index} = ${key}`)
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

  expect(changes).toEqual(["DELETE: 6 = G"]);
});

test("remove first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["DELETE: 0 = A"]);
});

test("remove from middle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "D", "E", "F"]
  );

  expect(changes).toEqual(["DELETE: 2 = C"]);
});

test("remove first and last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["B", "C", "D", "E"]
  );

  expect(changes).toEqual(["DELETE: 0 = A", "DELETE: 5 = F"]);
});

test("create", () => {
  const changes = simpleListDiff([], ["A", "B", "C"]);

  expect(changes).toEqual(["INSERT: 0 = A", "INSERT: 1 = B", "INSERT: 2 = C"]);
});

test("clear", () => {
  const changes = simpleListDiff(["A", "B", "C"], []);

  expect(changes).toEqual(["DELETE: 0 = A", "DELETE: 1 = B", "DELETE: 2 = C"]);
});

test("change first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "B", "C", "D", "E", "F"]
  );

  expect(changes).toEqual(["UPDATE: 0 = G"]);
});

test("change middle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "G", "D", "E", "F"]
  );

  expect(changes).toEqual(["UPDATE: 2 = G"]);
});

test("change last", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "D", "E", "G"]
  );

  expect(changes).toEqual(["UPDATE: 5 = G"]);
});

test("swap", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "E", "C", "D", "B", "F"]
  );

  expect(changes).toEqual(["UPDATE: 1 = E", "UPDATE: 4 = B"]);
});

test("shuffle", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["E", "C", "F", "A", "B", "D"]
  );

  expect(changes).toEqual([
    "UPDATE: 0 = E",
    "UPDATE: 1 = C",
    "UPDATE: 2 = F",
    "UPDATE: 3 = A",
    "UPDATE: 4 = B",
    "UPDATE: 5 = D",
  ]);
});

test("move items first", () => {
  const changes = simpleListDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["E", "F", "A", "B", "C", "D"]
  );

  expect(changes).toEqual([
    "UPDATE: 0 = E",
    "UPDATE: 1 = F",
    "UPDATE: 2 = A",
    "UPDATE: 3 = B",
    "UPDATE: 4 = C",
    "UPDATE: 5 = D",
  ]);
});
