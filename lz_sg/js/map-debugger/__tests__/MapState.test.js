import { MapState } from '../MapState.js';

/**
 * 运行所有测试
 */
export function runTests() {
    console.log('=== 开始运行 MapState 单元测试 ===\n');

    let passed = 0;
    let failed = 0;

    // 测试函数
    const tests = [
        testInitialState,
        testAddGrid,
        testAddGridAtExistingPosition,
        testDeleteGrid,
        testDeleteGridWithConnectionRepair,
        testMoveGrid,
        testConnectGrids,
        testDisconnectGrids,
        testGetGrid,
        testGetGridAtPosition,
        testSetEditMode,
        testSetSelectedGrid,
        testObserverPattern,
        testToJSON,
        testFromJSON
    ];

    // 运行所有测试
    tests.forEach(test => {
        try {
            test();
            console.log(`✓ ${test.name}`);
            passed++;
        } catch (error) {
            console.error(`✗ ${test.name}`);
            console.error(`  ${error.message}`);
            failed++;
        }
    });

    // 输出结果
    console.log(`\n=== 测试完成 ===`);
    console.log(`通过: ${passed}/${tests.length}`);
    console.log(`失败: ${failed}/${tests.length}`);

    if (failed === 0) {
        console.log('\n所有测试通过! ✓');
    } else {
        console.log('\n有测试失败! ✗');
        throw new Error(`${failed} 个测试失败`);
    }
}

/**
 * 测试初始化状态
 */
function testInitialState() {
    const state = new MapState();

    console.assert(state.grids.length === 0, '初始 grids 应为空数组');
    console.assert(state.nextId === 0, '初始 nextId 应为 0');
    console.assert(state.editMode === 'add', '初始 editMode 应为 add');
    console.assert(state.selectedGridId === null, '初始 selectedGridId 应为 null');
    console.assert(state.observers.length === 0, '初始 observers 应为空数组');
}

/**
 * 测试添加格子
 */
function testAddGrid() {
    const state = new MapState();

    // 添加第一个格子
    const grid1 = state.addGrid({ x: 0, y: 0, type: 'start' });
    console.assert(grid1 !== null, '应成功添加格子');
    console.assert(grid1.id === 0, '第一个格子 ID 应为 0');
    console.assert(grid1.x === 0, '格子 x 坐标应为 0');
    console.assert(grid1.y === 0, '格子 y 坐标应为 0');
    console.assert(grid1.type === 'start', '格子类型应为 start');
    console.assert(grid1.next === null, '格子 next 应为 null');
    console.assert(state.grids.length === 1, 'grids 数组长度应为 1');
    console.assert(state.nextId === 1, 'nextId 应递增为 1');

    // 添加第二个格子
    const grid2 = state.addGrid({ x: 1, y: 0 });
    console.assert(grid2 !== null, '应成功添加第二个格子');
    console.assert(grid2.id === 1, '第二个格子 ID 应为 1');
    console.assert(state.grids.length === 2, 'grids 数组长度应为 2');
    console.assert(state.nextId === 2, 'nextId 应递增为 2');
}

/**
 * 测试在已有格子的位置添加格子
 */
function testAddGridAtExistingPosition() {
    const state = new MapState();

    state.addGrid({ x: 0, y: 0 });
    const result = state.addGrid({ x: 0, y: 0 });

    console.assert(result === null, '在已有位置添加格子应返回 null');
    console.assert(state.grids.length === 1, 'grids 数组长度应保持为 1');
}

/**
 * 测试删除格子
 */
function testDeleteGrid() {
    const state = new MapState();

    // 添加三个格子
    const grid1 = state.addGrid({ x: 0, y: 0, type: 'start' });
    const grid2 = state.addGrid({ x: 1, y: 0 });
    const grid3 = state.addGrid({ x: 2, y: 0 });

    // 连接格子：grid1 -> grid2 -> grid3
    state.connectGrids(grid1.id, grid2.id);
    state.connectGrids(grid2.id, grid3.id);

    // 删除中间的格子
    const deleted = state.deleteGrid(grid2.id);

    console.assert(deleted !== null, '应成功删除格子');
    console.assert(deleted.id === grid2.id, '返回的应是被删除的格子');
    console.assert(state.grids.length === 2, 'grids 数组长度应为 2');
    console.assert(grid1.next === grid3, '路径应自动修复：grid1 -> grid3');
}

/**
 * 测试删除带有连接的格子（路径断裂修复）
 */
function testDeleteGridWithConnectionRepair() {
    const state = new MapState();

    // 创建路径：A -> B -> C -> D
    const gridA = state.addGrid({ x: 0, y: 0 });
    const gridB = state.addGrid({ x: 1, y: 0 });
    const gridC = state.addGrid({ x: 2, y: 0 });
    const gridD = state.addGrid({ x: 3, y: 0 });

    state.connectGrids(gridA.id, gridB.id);
    state.connectGrids(gridB.id, gridC.id);
    state.connectGrids(gridC.id, gridD.id);

    // 删除 C，应自动连接 B -> D
    state.deleteGrid(gridC.id);

    console.assert(gridB.next === gridD, '删除 C 后应自动连接 B -> D');
    console.assert(state.grids.length === 3, '应剩 3 个格子');
}

/**
 * 测试移动格子
 */
function testMoveGrid() {
    const state = new MapState();

    const grid1 = state.addGrid({ x: 0, y: 0 });
    const grid2 = state.addGrid({ x: 1, y: 0 });

    // 移动格子
    const success = state.moveGrid(grid1.id, 2, 0);

    console.assert(success === true, '移动应成功');
    console.assert(grid1.x === 2, '格子 x 坐标应更新为 2');
    console.assert(grid1.y === 0, '格子 y 坐标应保持为 0');

    // 尝试移动到已被占用的位置
    const failResult = state.moveGrid(grid1.id, 1, 0);
    console.assert(failResult === false, '移动到已被占用的位置应失败');
}

/**
 * 测试连接格子
 */
function testConnectGrids() {
    const state = new MapState();

    const grid1 = state.addGrid({ x: 0, y: 0 });
    const grid2 = state.addGrid({ x: 1, y: 0 });

    // 连接格子
    const success = state.connectGrids(grid1.id, grid2.id);

    console.assert(success === true, '连接应成功');
    console.assert(grid1.next === grid2, 'grid1 的 next 应指向 grid2');

    // 尝试自连接
    const selfConnect = state.connectGrids(grid1.id, grid1.id);
    console.assert(selfConnect === false, '自连接应失败');
}

/**
 * 测试断开格子连接
 */
function testDisconnectGrids() {
    const state = new MapState();

    const grid1 = state.addGrid({ x: 0, y: 0 });
    const grid2 = state.addGrid({ x: 1, y: 0 });

    state.connectGrids(grid1.id, grid2.id);

    // 断开连接
    const success = state.disconnectGrids(grid1.id, grid2.id);

    console.assert(success === true, '断开连接应成功');
    console.assert(grid1.next === null, 'grid1 的 next 应为 null');
}

/**
 * 测试获取格子
 */
function testGetGrid() {
    const state = new MapState();

    const grid1 = state.addGrid({ x: 0, y: 0 });

    const found = state.getGrid(grid1.id);
    console.assert(found === grid1, '应找到正确的格子');

    const notFound = state.getGrid(999);
    console.assert(notFound === null, '不存在的格子应返回 null');
}

/**
 * 测试根据坐标获取格子
 */
function testGetGridAtPosition() {
    const state = new MapState();

    state.addGrid({ x: 0, y: 0 });
    state.addGrid({ x: 1, y: 0 });

    const found = state.getGridAtPosition(0, 0);
    console.assert(found !== null, '应找到 (0, 0) 的格子');
    console.assert(found.x === 0 && found.y === 0, '坐标应正确');

    const notFound = state.getGridAtPosition(5, 5);
    console.assert(notFound === null, '不存在的位置应返回 null');
}

/**
 * 测试设置编辑模式
 */
function testSetEditMode() {
    const state = new MapState();

    state.setEditMode('select');
    console.assert(state.editMode === 'select', 'editMode 应更新为 select');

    state.setEditMode('delete');
    console.assert(state.editMode === 'delete', 'editMode 应更新为 delete');
}

/**
 * 测试设置选中的格子
 */
function testSetSelectedGrid() {
    const state = new MapState();

    const grid1 = state.addGrid({ x: 0, y: 0 });

    state.setSelectedGrid(grid1.id);
    console.assert(state.selectedGridId === grid1.id, 'selectedGridId 应更新');

    state.setSelectedGrid(null);
    console.assert(state.selectedGridId === null, 'selectedGridId 应清除');
}

/**
 * 测试观察者模式
 */
function testObserverPattern() {
    const state = new MapState();

    let eventReceived = null;
    let dataReceived = null;

    // 订阅事件
    const unsubscribe = state.subscribe((event, data) => {
        eventReceived = event;
        dataReceived = data;
    });

    // 触发事件
    state.addGrid({ x: 0, y: 0 });

    console.assert(eventReceived === 'grid:added', '应收到 grid:added 事件');
    console.assert(dataReceived.x === 0, '事件数据应正确');

    // 取消订阅
    unsubscribe();
    eventReceived = null;

    // 再次触发
    state.addGrid({ x: 1, y: 0 });

    console.assert(eventReceived === null, '取消订阅后不应收到事件');
}

/**
 * 测试导出 JSON
 */
function testToJSON() {
    const state = new MapState();

    const grid1 = state.addGrid({ x: 0, y: 0, type: 'start' });
    const grid2 = state.addGrid({ x: 1, y: 0 });
    state.connectGrids(grid1.id, grid2.id);

    const json = state.toJSON();
    const data = JSON.parse(json);

    console.assert(data.grids.length === 2, '导出的格子数量应为 2');
    console.assert(data.grids[0].id === 0, '第一个格子 ID 应为 0');
    console.assert(data.grids[0].nextId === 1, '第一个格子的 nextId 应为 1');
    console.assert(data.nextId === 2, 'nextId 应为 2');
}

/**
 * 测试从 JSON 导入
 */
function testFromJSON() {
    const state = new MapState();

    const json = JSON.stringify({
        grids: [
            { id: 0, x: 0, y: 0, type: 'start', nextId: 1 },
            { id: 1, x: 1, y: 0, type: 'normal', nextId: null }
        ],
        nextId: 2,
        editMode: 'select'
    });

    const success = state.fromJSON(json);

    console.assert(success === true, '导入应成功');
    console.assert(state.grids.length === 2, '导入后应有 2 个格子');
    console.assert(state.grids[0].id === 0, '第一个格子 ID 应为 0');
    console.assert(state.grids[0].next === state.grids[1], '连接关系应正确');
    console.assert(state.nextId === 2, 'nextId 应为 2');
    console.assert(state.editMode === 'select', 'editMode 应为 select');
}
