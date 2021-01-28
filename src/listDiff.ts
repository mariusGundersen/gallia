type Change = "INSERT" | "UPDATE" | "DELETE";

type Keyed = { key: string };

interface Callbacks<T extends Keyed> {
  insert(item: T): void;
  move(item: T): void;
  noop(): void;
  remove(item: T): void;
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
      callbacks.noop();
      a++;
      b++;
    } else {
      const indexOfItemAInListB = mapB.get(itemA.key);
      const indexOfItemBInListA = mapA.get(itemB.key);

      if (
        indexOfItemAInListB === undefined &&
        indexOfItemBInListA === undefined
      ) {
        callbacks.move(itemB);
        a++;
        b++;
      } else if (
        indexOfItemAInListB !== undefined &&
        indexOfItemBInListA !== undefined
      ) {
        callbacks.move(itemB);
        a++;
        b++;
      } else {
        if (indexOfItemAInListB === undefined) {
          callbacks.remove(itemA);
          a++;
        }
        if (indexOfItemBInListA === undefined) {
          callbacks.insert(itemB);
          b++;
        }
      }
    }
  }

  for (; a < la; a++) {
    callbacks.remove(listA[a]);
  }

  for (; b < lb; b++) {
    callbacks.insert(listB[b]);
  }
}
