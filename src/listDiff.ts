type Change = "INSERT" | "UPDATE" | "DELETE";

export default function listDiff(
  listA: string[],
  listB: string[],
  callback: (change: Change, index: number, key: string) => {}
) {
  let a = 0;
  let b = 0;
  const la = listA.length;
  const lb = listB.length;

  const mapA = new Map(listA.map((key, index) => [key, index]));
  const mapB = new Map(listB.map((key, index) => [key, index]));

  for (; a < la && b < lb; ) {
    const itemA = listA[a];
    const itemB = listB[b];

    if (itemA === itemB) {
      a++;
      b++;
    } else {
      const indexOfItemAInListB = mapB.get(itemA);
      const indexOfItemBInListA = mapA.get(itemB);

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
