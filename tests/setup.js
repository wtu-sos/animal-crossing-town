// 测试设置文件
// 模拟 Canvas API
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: [] })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  }))
}));

// 模拟 requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// 模拟 window 尺寸
global.innerWidth = 1024;
global.innerHeight = 768;

// 模拟 performance.now
global.performance = {
  now: jest.fn(() => Date.now())
};

// 模拟 console 方法（避免测试输出噪音）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn()
};
