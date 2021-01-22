export function createElementFromHTML(htmlString: string) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.firstChild as HTMLElement;
}
