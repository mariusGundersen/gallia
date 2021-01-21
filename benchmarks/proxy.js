import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();

const object = {
  visible: true
};

const proxy = new Proxy({
  visible: true
}, {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    return Reflect.set(target, prop, value, receiver);
  }
});

suite.add('basic object', () => {
  object.visible = !object.visible;
})
  .add('proxy object', () => {
    proxy.visible = !proxy.visible;
  })
  // add listeners
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // run async
  .run({ 'async': true });