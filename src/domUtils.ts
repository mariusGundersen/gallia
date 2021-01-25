export function isTextNode(node: Node): node is Text {
  return node.nodeName === "#text";
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
  return node.nodeName === "#document-fragment";
}

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
