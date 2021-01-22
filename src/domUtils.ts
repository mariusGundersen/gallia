export function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

export function isTemplateElement(node: Element): node is HTMLTemplateElement {
  return node.nodeName === "TEMPLATE";
}

export function insertAfter(reference: Node, node: Node) {
  if (reference.nextSibling) {
    reference.parentNode!.insertBefore(node, reference.nextSibling);
  } else {
    reference.parentNode!.appendChild(node);
  }
}
