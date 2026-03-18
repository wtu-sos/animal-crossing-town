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
    
    // 初始化虚拟摇杆
    initJoystick() {
        const joystickZone = document.getElementById('joystick-zone');
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        
        if (!joystickZone) return;
        
        let startX, startY;
        const maxDistance = 40; // 摇杆最大移动距离
        
        const handleStart = (e) => {
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystickBase.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            startX = centerX;
            startY = centerY;
            
            this.joystick.active = true;
            joystickStick.classList.add('active');
            
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
            this.joystick.force = 0;
            joystickStick.classList.remove('active');
            joystickStick.style.transform = 'translate(0, 0)';
        };
        
        // 触摸事件
        joystickZone.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        
        // 鼠标事件 (用于桌面测试)
        joystickZone.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
    }
    
    // 更新摇杆状态
    updateJoystick(clientX, clientY, maxDistance) {
        const joystickStick = document.getElementById('joystick-stick');
        
        let dx = clientX - this.startX;
        let dy = clientY - this.startY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = Math.min(distance, maxDistance) / maxDistance;
        
        if (distance > maxDistance) {
            const ratio = maxDistance / distance;
            dx *= ratio;
            dy *= ratio;
        }
        
        this.joystick.dx = (dx / maxDistance);
        this.joystick.dy = (dy / maxDistance);
        this.joystick.force = force;
        this.joystick.angle = Math.atan2(dy, dx);
        
        if (joystickStick) {
            joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
        }
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
