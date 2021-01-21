export default function domWalk(element: Node, handle: (value: Node, depth: number) => boolean | undefined, depth=0){
  if(handle(element, depth) === false) return;
  Array.from(element.childNodes)
    .forEach(e => domWalk(e, handle, depth+1));
}

export abstract class DomWalker {
  constructor(element: Node, depth = 0){
    if(this.visit(element, depth) === false) return;
    for(const node of Array.from(element.childNodes)){
      domWalk(node, this.visit, depth+1);
    }
  }

  abstract visit(element: Node, depth: number): boolean | undefined;
}