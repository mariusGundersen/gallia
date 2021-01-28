type Change = "INSERT" | "UPDATE" | "DELETE";

type Keyed = { key: string };

interface Callbacks<T extends Keyed> {
  insert(index: number, item: T): void;
  move(index: number, item: T): void;
  remove(index: number, item: T): void;
}

export default function listDiff<T extends Keyed>(
  listA: T[],
  listB: T[],
  callbacks: Callbacks<T>
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
        callbacks.move(a, itemB);
        a++;
        b++;
      } else if (
        indexOfItemAInListB !== undefined &&
        indexOfItemBInListA !== undefined
      ) {
        callbacks.move(a, itemB);
        a++;
        b++;
      } else {
        if (indexOfItemAInListB === undefined) {
          callbacks.remove(a, itemA);
          a++;
        }
        if (indexOfItemBInListA === undefined) {
          callbacks.insert(b, itemB);
          b++;
        }
      }
    }
  }

  for (; a < la; a++) {
    callbacks.remove(a, listA[a]);
  }

  for (; b < lb; b++) {
    callbacks.insert(b, listB[b]);
  }
}
