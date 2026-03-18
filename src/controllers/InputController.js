/**
 * 输入控制器 - 处理所有输入
 */
class InputController {
    constructor() {
        this.keys = {};
        this.joystick = {
            active: false,
            dx: 0,
            dy: 0
        };
        this.actionPressed = false;
        
        this.init();
    }
    
    init() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                this.actionPressed = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
            
            if (e.code === 'Space') {
                this.actionPressed = false;
            }
        });
        
        // 初始化摇杆
        this.initJoystick();
    }
    
    initJoystick() {
        const joystickZone = document.getElementById('joystick-zone');
        if (!joystickZone) return;
        
        let startX, startY;
        const maxDistance = 40;
        
        const handleStart = (e) => {
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystickZone.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            
            this.joystick.active = true;
            this.updateJoystick(touch.clientX, touch.clientY, maxDistance);
        };
        
        const handleMove = (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            this.updateJoystick(touch.clientX, touch.clientY, maxDistance);
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
        };
        
        joystickZone.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        
        joystickZone.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
    }
    
    updateJoystick(clientX, clientY, maxDistance) {
        let dx = clientX - this.startX;
        let dy = clientY - this.startY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            const ratio = maxDistance / distance;
            dx *= ratio;
            dy *= ratio;
        }
        
        this.joystick.dx = dx / maxDistance;
        this.joystick.dy = dy / maxDistance;
    }
    
    // 获取移动向量
    getMovementVector() {
        let dx = 0;
        let dy = 0;
        
        // 键盘输入
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;
        
        // 摇杆输入（优先级更高）
        if (this.joystick.active) {
            dx = this.joystick.dx;
            dy = this.joystick.dy;
        }
        
        // 归一化
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 1) {
            dx /= length;
            dy /= length;
        }
        
        return { x: dx, y: dy };
    }
    
    // 检查动作键
    isActionPressed() {
        const pressed = this.actionPressed;
        this.actionPressed = false; // 消费掉按键
        return pressed;
    }
    
    // 检查按键
    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputController;
}
