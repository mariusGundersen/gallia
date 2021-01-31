import listDiff from "./listDiff";

test("same lists", () => {
  const spy = jest.fn();
  listDiff(
    ["A", "B", "C", "D", "E", "F", "G"],
    ["A", "B", "C", "D", "E", "F", "G"],
    spy
  );

  expect(spy).not.toHaveBeenCalled();
});

test("appended", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "D", "E", "F", "G"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["INSERT: 6 = G"]);
});

test("prepend", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "A", "B", "C", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["INSERT: 0 = G"]);
});

test("insert into middle", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "G", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["INSERT: 3 = G"]);
});

test("append and prepend", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "A", "B", "C", "D", "E", "F", "H"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["INSERT: 0 = G", "INSERT: 7 = H"]);
});

test("remove last", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F", "G"],
    ["A", "B", "C", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["DELETE: 6 = G"]);
});

test("remove first", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["B", "C", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["DELETE: 0 = A"]);
});

test("remove from middle", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["DELETE: 2 = C"]);
});

test("remove first and last", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["B", "C", "D", "E"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["DELETE: 0 = A", "DELETE: 5 = F"]);
});

test("create", () => {
  const changes: string[] = [];
  listDiff([], ["A", "B", "C"], (change, index, key) =>
    changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["INSERT: 0 = A", "INSERT: 1 = B", "INSERT: 2 = C"]);
});

test("clear", () => {
  const changes: string[] = [];
  listDiff(["A", "B", "C"], [], (change, index, key) =>
    changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["DELETE: 0 = A", "DELETE: 1 = B", "DELETE: 2 = C"]);
});

test("change first", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["G", "B", "C", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["UPDATE: 0 = G"]);
});

test("change middle", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "G", "D", "E", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["UPDATE: 2 = G"]);
});

test("change last", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "B", "C", "D", "E", "G"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["UPDATE: 5 = G"]);
});

test("swap", () => {
  const changes: string[] = [];
  listDiff(
    ["A", "B", "C", "D", "E", "F"],
    ["A", "E", "C", "D", "B", "F"],
    (change, index, key) => changes.push(`${change}: ${index} = ${key}`)
  );

  expect(changes).toEqual(["UPDATE: 1 = E", "UPDATE: 4 = B"]);
});
