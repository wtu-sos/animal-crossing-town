/**
 * 新架构入口 - 使用ES Modules
 */
import GameController from './src/controllers/GameController.js';

// 等待DOM加载
window.addEventListener('load', async () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    try {
        // 创建游戏控制器
        const game = new GameController(canvas);
        
        // 初始化
        await game.init();
        
        // 暴露到全局（调试用）
        window.game = game;
        
        console.log('Game started with new architecture');
    } catch (error) {
        console.error('Failed to start game:', error);
        // 回滚到旧架构
        console.log('Falling back to legacy code...');
        loadLegacyCode();
    }
});

// 回滚到旧代码
function loadLegacyCode() {
    const scripts = [
        'js/input.js',
        'js/camera.js',
        'js/map.js',
        'js/player.js',
        'js/renderer.js',
        'js/goap.js',
        'js/gameplay.js',
        'js/game.js'
    ];
    
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
    });
}
