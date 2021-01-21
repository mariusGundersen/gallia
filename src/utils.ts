export function makeExpressionEvaluator(expression: string) {
  return new Function('$data', `with($data){return ${expression}}`)
}

export function makeTextEvaluator(expression: string) {
  return new Function('$data', `with($data){return \`${expression}\`;}`)
}

export function makeEventHandler(expression: string){
  return new Function('$data', '$e', `with($data){return ${expression};}`)
}
