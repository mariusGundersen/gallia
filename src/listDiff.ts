type Change = "INSERT" | "UPDATE" | "DELETE";

type Keyed = { key: string };

export default function listDiff<T extends Keyed>(
  listA: T[],
  listB: T[],
  callback: (change: Change, index: number, item: T) => {}
) {
  let a = 0;
  let b = 0;
  const la = listA.length;
  const lb = listB.length;

  const mapA = new Map(listA.map(({ key }, index) => [key, index]));
  const mapB = new Map(listB.map(({ key }, index) => [key, index]));

  for (; a < la && b < lb; ) {
    const itemA = listA[a];
    const itemB = listB[b];

    if (itemA.key === itemB.key) {
      a++;
      b++;
    } else {
      const indexOfItemAInListB = mapB.get(itemA.key);
      const indexOfItemBInListA = mapA.get(itemB.key);

      if (
        indexOfItemAInListB === undefined &&
        indexOfItemBInListA === undefined
      ) {
        callback("UPDATE", a, itemB);
        a++;
        b++;
      } else if (
        indexOfItemAInListB !== undefined &&
        indexOfItemBInListA !== undefined
      ) {
        callback("UPDATE", a, itemB);
        a++;
        b++;
      } else {
        if (indexOfItemAInListB === undefined) {
          callback("DELETE", a, itemA);
          a++;
        }
        if (indexOfItemBInListA === undefined) {
          callback("INSERT", b, itemB);
          b++;
        }
      }
    }
  }

  for (; a < la; a++) {
    callback("DELETE", a, listA[a]);
  }

  for (; b < lb; b++) {
    callback("INSERT", b, listB[b]);
  }
}
