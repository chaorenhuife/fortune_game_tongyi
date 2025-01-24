# 2025新年接福游戏 - 详细需求文档

## 1. HTML结构

### 1.1 文档基础
- `<!DOCTYPE html>`: HTML5文档类型
- `<html lang="zh-CN">`: 中文语言设置
- `<meta charset="UTF-8">`: UTF-8字符编码
- `<meta name="viewport">`: 移动设备适配
- `<title>`: 显示"2025新年接福游戏"

### 1.2 页面结构
1. 欢迎页（welcome-page）
   - 背景图容器（welcome-content）
   - 开始按钮（start-button）
   - 按钮文字："开始接福"

2. 游戏页（game-page）
   - 顶部信息栏（game-header）
     - 福气值显示
     - 倒计时显示
   - 游戏容器（game-container）
     - Canvas画布
     - 玩家角色容器

3. 结算弹窗（result-modal）
   - 无需新起一个页面，直接在游戏页弹出，并停止游戏
   - 模态框容器
   - 结果标题
   - 最终分数
   - 重玩按钮

## 2. CSS样式规范

### 2.1 全局样式
- 字体：微软雅黑（Microsoft YaHei）
- 背景色：#f8f8f8
- 溢出处理：hidden
- 盒模型：border-box

### 2.2 欢迎页样式
- 背景：新年红（#FF4D4F）
- 开始按钮：
  - 渐变背景：#FFD700 到 #FFA500
  - 文字颜色：#D4380D
  - 字体大小：24px
  - 内边距：20px 40px
  - 圆角：30px
  - 阴影效果
  - 悬停动画

### 2.3 游戏页样式
- 背景图：game_background.jpeg
- 顶部信息栏：
  - 半透明背景
  - 圆角设计
  - 字体颜色：#D4380D
- 游戏画布：
  - 全屏适配
  - 溢出隐藏
- 玩家角色：
  - 宽度：120px
  - 底部固定
  - 平滑移动过渡

### 2.4 结算弹窗样式
- 模态框：
  - 半透明黑色背景
  - 居中显示
  - 弹出动画
- 内容区：
  - 渐变背景
  - 圆角：30px
  - 内边距：50px
- 分数显示：
  - 字体大小：120px（数字）
  - 渐变金色文字效果
- 重玩按钮：
  - 样式同开始按钮
  - 悬停效果

## 3. JavaScript功能实现

### 3.1 游戏配置
```javascript
const GAME_CONFIG = {
    GAME_DURATION: 30,        // 游戏时长（秒）
    ITEM_SPAWN_INTERVAL: 300, // 物品生成间隔（毫秒）
    BOMB_SPAWN_INTERVAL: 5000,// 炸弹生成间隔（毫秒）
    ITEM_FALL_SPEED: 3,      // 物品下落速度
    PLAYER_SPEED: 15,        // 玩家移动速度
    SCORE_PER_ITEM: 10,      // 每个物品的分数
    PLAYER_SIZE: 150,        // 玩家大小
    ITEM_SIZE: 50,          // 物品大小
    BOMB_SIZE: 60           // 炸弹大小
}
```

### 3.2 核心功能模块
1. 初始化系统
   - 使用 loadImage() 函数预加载所有图片资源到 imageCache 对象中
   - 使用 Audio() 构造函数预加载所有音效到 audioCache 对象中
   - 获取画布元素并设置宽高为窗口大小 (window.innerWidth/Height)
   - 将玩家初始位置设置在画布底部中心位置 (canvas.width/2, canvas.height-PLAYER_SIZE)
   - 添加错误处理机制，当资源加载失败时提供重试选项
   - 显示加载进度条，实时反馈加载状态

2. 玩家控制系统
   - 监听 keydown 事件处理左右方向键移动:
     - 左键(37)减少 x 坐标
     - 右键(39)增加 x 坐标
     - 移动速度为 PLAYER_SPEED
   - 监听 touchstart/touchmove 事件:
     - 记录起始触摸点
     - 根据移动距离和方向调整玩家位置
   - 确保玩家不会移出画布范围 (0 到 canvas.width-PLAYER_SIZE)
   - 使用 requestAnimationFrame 实现平滑移动效果

3. 物品生成系统
   - 创建 Item 类定义物品属性(类型、位置、速度等)
   - 使用 setInterval 按 ITEM_SPAWN_INTERVAL 间隔生成普通物品
   - 物品初始 y 坐标为 0,x 坐标随机 (0 到 canvas.width-ITEM_SIZE)
   - 使用 setInterval 按 BOMB_SPAWN_INTERVAL 间隔生成炸弹
   - 物品类型随机从预定义数组中选择

4. 碰撞检测系统
   - 使用矩形碰撞检测算法:
     - 获取物品和玩家的位置及大小
     - 判断两个矩形是否相交
   - 当发生碰撞时:
     - 普通物品:增加分数,播放收集音效,移除物品
     - 炸弹:游戏结束,播放爆炸音效

5. 计分系统
   - 维护 currentScore 变量记录当前分数
   - 不同物品对应不同分值(SCORE_PER_ITEM 的倍数)
   - 使用 CSS animation 实现分数增加动画效果
   - 实时更新页面上的分数显示元素

6. 音效系统
   - 创建 AudioManager 类管理所有音效:
     - 背景音乐:循环播放,可暂停/继续
     - 物品音效:随机从多个音效中选择
     - 按钮音效:点击时播放
     - 炸弹音效:碰撞时播放
   - 提供音量控制和静音功能

### 3.3 游戏流程控制
1. 开始游戏
   - 调用 resetGame() 重置所有游戏状态和变量
   - 启动 30 秒倒计时器(setInterval)
   - 调用 startItemGeneration() 开始物品生成
   - 调用 audioManager.playBGM() 播放背景音乐
   - 初始化得分系统，设置初始分数为0
   - 启动性能监控系统，记录FPS和内存使用情况
   - 用户点击开始游戏，进入游戏进行页

2. 游戏进行中
   - 使用 requestAnimationFrame 实现游戏循环:
     - 更新所有物品位置(y 坐标增加 ITEM_FALL_SPEED)
     - 更新玩家位置
     - 检测所有物品的碰撞
     - 更新分数显示
   - 移除超出画布底部的物品

3. 游戏结束
   - 清除所有定时器(clearInterval)
   - 调用 audioManager.stopBGM() 停止背景音乐
   - 显示带有渐变动画的结算模态框
   - 显示最终分数和最高分记录
   - 提供重新开始按钮

## 4. 资源清单

### 4.1 图片资源
```
image/
├── welcome_background.jpeg  // 欢迎页背景
├── game_background.jpeg    // 游戏页背景
├── user.png               // 玩家角色
├── yuanbao.png           // 元宝
├── hongbao.png           // 红包
├── fudai.png            // 福袋
├── jintiao.png          // 金砖
├── zhuanshi.png         // 钻石
├── zhihongbao.png       // 支红包
├── dahongbao.png        // 双红包
└── bomb.png             // 炸弹
```

### 4.1 图片资源规格
1. 图片格式要求
   - 所有图片必须为PNG格式，支持透明背景
   - 图片分辨率：72dpi
   - 压缩级别：中等，确保文件大小适中

2. 尺寸规格
   - 玩家角色（user.png）：150x150px
   - 掉落物品：统一50x50px
   - 炸弹：60x60px
   - 背景图：1920x1080px，支持自适应缩放

3. 图片加载优先级
   - 关键资源（玩家角色、基础物品）：优先加载
   - 装饰性资源（背景图）：次优先级
   - 特效资源：最后加载

4. 性能优化建议
   - 图片总大小控制在2MB以内
   - 使用适当的压缩算法
   - 考虑使用CSS Sprite合并小图标
   - 图片缓存策略：localStorage或IndexedDB

### 4.2 音效资源
```
music/
├── background_music.mp3  // 背景音乐
├── button.mp3           // 按钮音效
├── music1.mp3           // 物品音效1
├── music2.mp3           // 物品音效2
├── music3.mp3           // 物品音效3
├── music4.mp3           // 物品音效4
└── bomb.mp3             // 炸弹音效
```

## 5. 图片加载与显示要求

### 5.1 图片加载流程
1. 游戏启动前的准备工作
   - 在游戏正式开始前，必须确保所有图片资源完全加载完成
   - 显示加载进度提示，让用户知道当前状态
   - 如果图片加载失败，需要显示友好的错误提示并提供重试选项

2. 加载优先级管理
   - 第一优先级：玩家角色图片（user.png）
   - 第二优先级：游戏必需的物品图片（元宝、红包等）
   - 第三优先级：炸弹图片
   - 最后加载：背景图片

3. 图片加载状态监控
   - 实时跟踪每个图片的加载状态
   - 记录已加载图片数量和总图片数量
   - 在控制台输出详细的加载日志，方便调试

### 5.2 Canvas渲染注意事项
1. 画布初始化
   - 游戏开始时必须正确设置Canvas的尺寸
   - 画布尺寸应该适配当前窗口大小
   - 需要处理设备像素比（DPI）以确保清晰度

2. 渲染顺序
   - 每一帧先清空整个画布
   - 按照从后到前的顺序绘制：背景 -> 物品 -> 炸弹 -> 玩家
   - 确保渲染循环稳定运行

3. 性能优化
   - 使用requestAnimationFrame进行渲染
   - 只在画布可见时进行渲染
   - 避免不必要的重绘

### 5.3 常见问题解决方案
1. 图片无法显示的排查步骤
   - 检查图片路径是否正确
   - 确认图片是否已完全加载
   - 验证Canvas上下文是否正确获取
   - 检查渲染循环是否正常运行

2. 画面卡顿问题
   - 控制同屏物品数量
   - 优化碰撞检测逻辑
   - 使用图片预加载和缓存

3. 图片模糊问题
   - 正确处理设备像素比
   - 使用合适尺寸的图片资源
   - 确保Canvas尺寸设置正确

### 5.4 开发调试建议
1. 开发环境配置
   - 启用浏览器开发工具
   - 监控网络请求面板中的图片加载情况
   - 使用Performance面板分析渲染性能

2. 日志记录
   - 记录图片加载成功和失败事件
   - 跟踪Canvas渲染状态
   - 输出关键性能指标

3. 测试检查项
   - 验证所有图片是否正确显示
   - 检查图片尺寸是否符合要求
   - 测试不同设备和浏览器的兼容性
   - 确认动画效果流畅度

### 2.3 游戏页面布局规范
1. 画布（Canvas）设置
   - 画布必须使用 position: absolute 定位
   - 宽度设置：width: 100%
   - 高度设置：height: 100%
   - z-index: 1
   - 背景：透明
   - 禁止出现滚动条：overflow: hidden

2. 玩家角色容器（player-container）设置
   - position: absolute
   - width: 100%
   - height: 150px
   - bottom: 0
   - left: 0
   - z-index: 2
   - overflow: visible
   - pointer-events: none

3. 玩家角色（player）设置
   - position: absolute
   - width: 150px
   - height: 150px
   - bottom: 0
   - transform: none
   - transition: left 0.1s linear
   - pointer-events: none
   - 不使用 transform: translate(-50%, 0) 避免出现重影
   - 初始位置：left = (window.innerWidth - PLAYER_SIZE) / 2

### 3.2 画布与玩家渲染规范
1. 画布初始化

2. 玩家位置计算
   ```

3. 窗口大小改变处理
   ```

### 5.5 画布与玩家渲染注意事项
1. 避免玩家重影问题
   - 不要使用CSS transform进行玩家定位
   - 使用绝对定位（left）控制玩家水平位置
   - 确保只有一个玩家DOM元素
   - 移动时使用style.left而不是transform

2. 保持画面比例
   - 画布始终保持全屏
   - 物品大小使用固定像素值
   - 玩家大小使用固定像素值
   - 避免使用百分比定义游戏元素大小

3. 性能优化
   - 使用requestAnimationFrame进行动画
   - 避免频繁的DOM操作
   - 使用CSS transform3d开启硬件加速
   - 控制同屏物品数量

4. 调试建议
   - 使用Chrome DevTools的Performance面板分析性能
   - 监控FPS确保流畅度
   - 检查DOM元素层级关系
   - 验证玩家位置计算是否正确

### 2.1 全局样式
```css
/* 全局样式设置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-touch-callout: none;    /* 禁止长按菜单 */
    -webkit-user-select: none;      /* 禁止选择文本 */
    -webkit-tap-highlight-color: transparent; /* 禁止触摸高亮 */
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;          /* 禁止页面滚动 */
    position: fixed;           /* 固定页面 */
    touch-action: none;        /* 禁止默认触摸行为 */
    background-color: #f8f8f8; /* 设置背景色 */
}

#app {
    width: 100%;
    height: 100%;
    position: fixed;
    overflow: hidden;
    touch-action: none;
}
```

### 2.2 触摸事件处理规范
1. 事件预防措施
   - 在所有触摸事件中添加 `preventDefault()`
   - 使用 `passive: false` 确保可以阻止默认行为
   - 在移动端监听 `touchmove` 时必须阻止默认滚动

2. 事件监听设置
```javascript
// 阻止页面滚动和拖动
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// 阻止双指缩放
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// 阻止双击缩放
document.addEventListener('dblclick', function(e) {
    e.preventDefault();
});
```

3. 游戏容器设置
   - 游戏容器必须使用 `position: fixed`
   - 设置 `touch-action: none` 禁止默认触摸行为
   - 背景图片使用 `background-attachment: fixed`

### 2.3 背景图片处理规范
1. 背景图片设置
```css
.game-container {
    position: fixed;
    width: 100%;
    height: 100%;
    background-image: url('path/to/background.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    -webkit-overflow-scrolling: touch; /* iOS滚动优化 */
    touch-action: none;
}
```

2. 移动端适配
   - 使用 `viewport` 设置禁止缩放
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```
   - 禁用页面弹性滚动效果
   ```css
   body {
       overscroll-behavior: none;
       -webkit-overflow-scrolling: auto;
   }
   ```

3. 玩家移动优化
   - 触摸移动时使用 `requestAnimationFrame` 更新位置
   - 保存上一次触摸位置，计算相对移动距离
   - 限制移动范围在可视区域内

### 5.6 移动端性能优化
1. 渲染优化
   - 使用 CSS will-change 提前告知浏览器变化的属性
   - 使用 transform3d 触发GPU加速
   - 避免频繁的DOM重排
   - 使用 requestAnimationFrame 代替 setTimeout/setInterval

2. 内存管理
   - 及时清理不再使用的对象
   - 控制内存峰值
   - 定期进行垃圾回收
   - 监控内存泄漏

3. 触摸事件优化
   - 使用事件委托减少事件监听器数量
   - 使用 debounce/throttle 控制事件触发频率
   - 优化触摸反馈延迟

4. 资源加载策略
   - 实现资源的按需加载
   - 合理使用预加载和懒加载
   - 利用浏览器缓存机制
   - 监控并优化加载性能
