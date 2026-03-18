/**
 * 输入控制系统 - 处理键盘和触摸输入
 */
class InputManager {
    constructor() {
        this.keys = {};
        this.joystick = {
            active: false,
            dx: 0,
            dy: 0,
            angle: 0,
            force: 0
        };
        
        this.initKeyboard();
        this.initJoystick();
    }
    
    // 初始化键盘控制
    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
    }
    
    // 初始化虚拟摇杆（已禁用）
    initJoystick() {
        // 虚拟摇杆已移除，仅保留键盘控制
        console.log('Virtual joystick disabled - using keyboard only');
    }
    
    // 更新摇杆状态（已禁用）
    updateJoystick(clientX, clientY, maxDistance) {
        // 虚拟摇杆已禁用
    }
    
    // 获取移动方向向量
    getMovementVector() {
        let dx = 0;
        let dy = 0;
        
        // 键盘输入
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;
        
        // 摇杆输入 (优先级更高)
        if (this.joystick.active) {
            dx = this.joystick.dx;
            dy = this.joystick.dy;
        }
        
        // 归一化向量
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 1) {
            dx /= length;
            dy /= length;
        }
        
        return { x: dx, y: dy };
    }
    
    // 检查按键是否按下
    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
}

// 为了测试，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}
