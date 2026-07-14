import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

/**
 * aiXcoder 管理后台 - 数据统计 - 团队数据 测试脚本
 *
 * 测试目标: http://192.168.1.159/statistics
 * 前置条件: 已登录 (ai_leader / Syw123456)
 */

// ==================== 配置区域 ====================
const BASE_URL = 'http://192.168.1.159';
const STATISTICS_PATH = '/statistics';

// ==================== 团队数据测试 ====================

test.describe.serial('数据统计 - 团队数据', () => {

  // 每个测试前先登录
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // -------------------- 页面加载与基础元素 --------------------

  test('页面加载 - 验证标题与描述', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证页面标题
    await expect(page.getByRole('heading', { name: '团队数据', level: 1 })).toBeVisible();
    // 验证副标题描述
    await expect(page.getByText('团队使用情况与效率分析')).toBeVisible();
  });

  test('侧边栏导航 - 数据统计面板菜单展开', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证侧边栏"数据统计面板"下三个子菜单
    await expect(page.getByRole('link', { name: '团队数据' })).toBeVisible();
    await expect(page.getByRole('link', { name: '成员数据' })).toBeVisible();
    await expect(page.getByRole('link', { name: '采纳反馈' })).toBeVisible();
  });

  // -------------------- 时间范围筛选 --------------------

  test('时间筛选 - 切换到"今日"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '今日', exact: true }).click();

    // 验证 URL 无 dateRange 参数（今日为默认）
    await expect(page).toHaveURL(/.*\/statistics$/);
  });

  test('时间筛选 - 切换到"昨日"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '昨日', exact: true }).click();

    // 验证 URL 包含 dateRange=yesterday
    await expect(page).toHaveURL(/.*dateRange=yesterday/);
  });

  test('时间筛选 - 切换到"近7天"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '近7天' }).click();

    // 验证 URL 包含 dateRange=last7days
    await expect(page).toHaveURL(/.*dateRange=last7days/);
  });

  test('时间筛选 - 切换到"近30天"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '近30天' }).click();

    // 验证 URL 包含 dateRange=last30days（数据量大时可能需要更长时间）
    await expect(page).toHaveURL(/.*dateRange=last30days/, { timeout: 15000 });
  });

  test('时间筛选 - 切换到"自定义"日期选择器', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '自定义' }).click();

    // 验证自定义日期输入框出现
    await expect(page.getByText('开始日期')).toBeVisible();
    await expect(page.getByText('结束日期')).toBeVisible();
    // 验证日期输入框存在
    const startDateInput = page.locator('input').first();
    const endDateInput = page.locator('input').nth(1);
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
  });

  test('时间筛选 - "今日"和"昨日"在趋势图模式下被禁用', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 先切换到趋势图模式
    await page.getByRole('button', { name: '趋势图' }).click();

    // 验证"今日"和"昨日"按钮被禁用
    await expect(page.getByRole('button', { name: '今日', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: '昨日', exact: true })).toBeDisabled();
    // "近7天"和"近30天"仍可用
    await expect(page.getByRole('button', { name: '近7天' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '近30天' })).toBeEnabled();
  });

  // -------------------- 视图模式切换 --------------------

  test('视图模式 - 切换到"趋势图"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    // 先选择近7天（趋势图需要多日数据）
    await page.getByRole('button', { name: '近7天' }).click();

    await page.getByRole('button', { name: '趋势图' }).click();

    // 验证 URL 包含 viewMode=trend
    await expect(page).toHaveURL(/.*viewMode=trend/);

    // 验证趋势图标题出现
    await expect(page.getByRole('heading', { name: '用户活跃度趋势' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '功能使用频次趋势' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '各功能采纳率趋势' })).toBeVisible();
  });

  test('视图模式 - 从"趋势图"切回"累计值"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    // 先切换到趋势图
    await page.getByRole('button', { name: '近7天' }).click();
    await page.getByRole('button', { name: '趋势图' }).click();
    await expect(page).toHaveURL(/.*viewMode=trend/);

    // 切回累计值
    await page.getByRole('button', { name: '累计值' }).click();

    // 验证 URL 不再包含 viewMode=trend
    await expect(page).toHaveURL(/.*\/statistics\?dateRange=last7days$/);

    // 验证累计值视图的指标卡片出现
    await expect(page.getByRole('heading', { name: '补全活跃用户数' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '对话活跃用户数' })).toBeVisible();
  });

  // -------------------- IDE 筛选 --------------------

  test('IDE筛选 - 打开下拉菜单并显示IDE列表', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '全部 IDE' }).click();

    // 验证 IDE 列表出现
    const ideMenu = page.getByRole('menu', { name: '全部 IDE' });
    await expect(ideMenu).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'CLion' })).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'Cursor' })).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'GoLand' })).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'IntelliJ IDEA' })).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'PyCharm' })).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'Visual Studio Code' })).toBeVisible();
    await expect(ideMenu.getByRole('menuitemcheckbox', { name: 'WebStorm' })).toBeVisible();

    // 关闭菜单
    await page.keyboard.press('Escape');
  });

  test('IDE筛选 - 选择指定IDE后筛选生效', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '全部 IDE' }).click();

    // 选择 IntelliJ IDEA
    const ideMenu = page.getByRole('menu', { name: '全部 IDE' });
    await ideMenu.getByRole('menuitemcheckbox', { name: 'IntelliJ IDEA' }).click();

    // 验证按钮文本变为 IntelliJ IDEA
    await expect(page.getByRole('button', { name: 'IntelliJ IDEA' })).toBeVisible();

    // 关闭菜单
    await page.keyboard.press('Escape');
  });

  // -------------------- 部门筛选 --------------------

  test('部门筛选 - 打开下拉菜单并显示部门树', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('button', { name: '全部部门' }).click();

    // 验证部门树出现
    const deptMenu = page.getByRole('menu', { name: '全部部门' });
    await expect(deptMenu).toBeVisible();
    // 验证顶层组织名称存在
    await expect(deptMenu.getByRole('treeitem', { name: 'aiXcoder 硅心科技' })).toBeVisible();

    // 关闭菜单
    await page.keyboard.press('Escape');
  });

  // -------------------- 活跃情况 - 累计值视图 --------------------

  test('活跃情况 - 用户活跃度卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"活跃情况"大区块标题
    await expect(page.getByRole('heading', { name: '活跃情况', level: 2 })).toBeVisible();

    // 验证"用户活跃度"区块
    await expect(page.getByRole('heading', { name: '用户活跃度', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '补全活跃用户数' })).toBeVisible();
    await expect(page.getByText('至少采纳一次代码补全')).toBeVisible();
    await expect(page.getByRole('heading', { name: '对话活跃用户数' })).toBeVisible();
    await expect(page.getByText('使用询问 / Agent / Edit 功能')).toBeVisible();
  });

  test('活跃情况 - 功能使用频次卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"功能使用频次"区块
    await expect(page.getByRole('heading', { name: '功能使用频次', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '用户发出指令次数' })).toBeVisible();
    await expect(page.getByText('所有对话模式指令总数')).toBeVisible();
    await expect(page.getByRole('heading', { name: '补全生成次数' })).toBeVisible();
    await expect(page.getByText('成功展示代码补全建议')).toBeVisible();
  });

  test('活跃情况 - 各类工具调用次数展示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"各类工具调用次数"区块
    await expect(page.getByRole('heading', { name: '各类工具调用次数' })).toBeVisible();
    // 验证"工具调用总次数"标签存在
    await expect(page.getByText('工具调用总次数')).toBeVisible();
    // 验证"查看各类工具调用次数完整明细"按钮存在（页面有两个同名按钮，取第一个）
    await expect(page.getByRole('button', { name: '查看各类工具调用次数完整明细' }).first()).toBeVisible();
  });

  test('活跃情况 - 各类模型的Token生成数展示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"各类模型的 Token 生成数"区块
    await expect(page.getByRole('heading', { name: '各类模型的 Token 生成数' })).toBeVisible();
    // 验证"对话模式 Token 总数"标签存在
    await expect(page.getByText('对话模式 Token 总数')).toBeVisible();
    // 验证"查看各类模型的 Token 生成数完整明细"按钮存在
    await expect(page.getByRole('button', { name: '查看各类模型的 Token 生成数完整明细' }).first()).toBeVisible();
  });

  // -------------------- 效率指标 - 累计值视图 --------------------

  test('效率指标 - 补全功能效率卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"效率指标"大区块标题
    await expect(page.getByRole('heading', { name: '效率指标', level: 2 })).toBeVisible();

    // 验证"补全功能效率"区块
    await expect(page.getByRole('heading', { name: '补全功能效率', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '补全采纳次数' })).toBeVisible();
    await expect(page.getByText('接受补全建议的次数')).toBeVisible();
    await expect(page.getByRole('heading', { name: '补全采纳率（次）' })).toBeVisible();
    await expect(page.getByText('采纳次数占生成次数比例')).toBeVisible();
  });

  test('效率指标 - 询问模式功能效率卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"询问模式功能效率"区块
    await expect(page.getByRole('heading', { name: '询问模式功能效率', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '生成代码块行数' })).toBeVisible();
    await expect(page.getByText('询问模式生成的代码行数')).toBeVisible();
    await expect(page.getByRole('heading', { name: '代码使用行数' })).toBeVisible();
    await expect(page.getByText('询问模式代码使用行数')).toBeVisible();
    await expect(page.getByRole('heading', { name: '代码使用率' })).toBeVisible();
    await expect(page.getByText('代码使用行数占生成行数比例')).toBeVisible();
    await expect(page.getByRole('heading', { name: '应用行数' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '复制行数' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '插入行数' })).toBeVisible();
  });

  test('效率指标 - Agent功能效率卡片显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 验证"Agent 功能效率"区块
    await expect(page.getByRole('heading', { name: 'Agent 功能效率', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agent 代码生成行数' })).toBeVisible();
    await expect(page.getByText('Agent 推荐代码变更行数')).toBeVisible();
    await expect(page.getByRole('heading', { name: '用户采纳代码行数' })).toBeVisible();
    await expect(page.getByText('用户接受并应用的代码行数')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agent 代码采纳率' })).toBeVisible();
    await expect(page.getByText('用户采纳行数占 Agent 推荐变更行数比例')).toBeVisible();
  });

  // -------------------- 明细弹窗 --------------------

  test('明细弹窗 - 打开"各类工具调用次数明细"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 点击查看完整明细按钮（页面有两个同名按钮，点击第一个）
    await page.getByRole('button', { name: '查看各类工具调用次数完整明细' }).first().click();

    // 验证弹窗出现
    await expect(page.getByRole('heading', { name: '各类工具调用次数明细' })).toBeVisible();
    await expect(page.getByText(/共.*按次数降序展示/)).toBeVisible();

    // 验证表头
    await expect(page.getByRole('columnheader', { name: '名称' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '次数' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '占比' })).toBeVisible();

    // 验证表格有数据行
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();
    expect(await tableRows.count()).toBeGreaterThan(0);

    // 关闭弹窗
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: '各类工具调用次数明细' })).not.toBeVisible();
  });

  test('明细弹窗 - 打开"各类模型的Token生成数明细"', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    // 点击查看完整明细按钮
    await page.getByRole('button', { name: '查看各类模型的 Token 生成数完整明细' }).first().click();

    // 验证弹窗出现
    await expect(page.getByRole('heading', { name: '各类模型的 Token 生成数明细' })).toBeVisible();
    await expect(page.getByText(/共.*按 Token 总量降序展示/)).toBeVisible();

    // 验证表头（比工具调用多了输入/输出/总数列）
    await expect(page.getByRole('columnheader', { name: '名称' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '输入' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '输出' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '总数' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '占比' })).toBeVisible();

    // 验证表格有数据行
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible();
    expect(await tableRows.count()).toBeGreaterThan(0);

    // 关闭弹窗
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: '各类模型的 Token 生成数明细' })).not.toBeVisible();
  });

  // -------------------- 趋势图视图验证 --------------------

  test('趋势图视图 - 用户活跃度趋势图显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    await page.getByRole('button', { name: '近7天' }).click();
    await page.getByRole('button', { name: '趋势图' }).click();

    // 验证趋势图标题
    await expect(page.getByRole('heading', { name: '用户活跃度趋势' })).toBeVisible();
    // 验证图例
    await expect(page.getByText('对话活跃用户')).toBeVisible();
    await expect(page.getByText('补全活跃用户')).toBeVisible();
  });

  test('趋势图视图 - 功能使用频次趋势图显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    await page.getByRole('button', { name: '近7天' }).click();
    await page.getByRole('button', { name: '趋势图' }).click();

    await expect(page.getByRole('heading', { name: '功能使用频次趋势' })).toBeVisible();
    await expect(page.getByText('用户发出指令次数')).toBeVisible();
    await expect(page.getByText('补全生成次数')).toBeVisible();
  });

  test('趋势图视图 - 各功能采纳率趋势图显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    await page.getByRole('button', { name: '近7天' }).click();
    await page.getByRole('button', { name: '趋势图' }).click();

    await expect(page.getByRole('heading', { name: '各功能采纳率趋势' })).toBeVisible();
    await expect(page.getByText('Agent 采纳率')).toBeVisible();
    await expect(page.getByText('补全采纳率')).toBeVisible();
    await expect(page.getByText('询问模式采纳率')).toBeVisible();
  });

  test('趋势图视图 - 询问模式代码相关趋势图显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    await page.getByRole('button', { name: '近7天' }).click();
    await page.getByRole('button', { name: '趋势图' }).click();

    await expect(page.getByRole('heading', { name: '询问模式代码生成行数' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '询问模式代码使用行数趋势' })).toBeVisible();
    // 询问模式代码使用行数趋势图有多个图例（使用 exact 精确匹配，避免匹配到标题）
    await expect(page.getByText('代码使用行数', { exact: true })).toBeVisible();
    await expect(page.getByText('复制行数', { exact: true })).toBeVisible();
    await expect(page.getByText('应用行数', { exact: true })).toBeVisible();
    await expect(page.getByText('插入行数', { exact: true })).toBeVisible();
  });

  test('趋势图视图 - Agent代码相关趋势图显示', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);
    await page.getByRole('button', { name: '近7天' }).click();
    await page.getByRole('button', { name: '趋势图' }).click();

    await expect(page.getByRole('heading', { name: 'Agent 代码生成行数', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '用户采纳 Agent 代码生成行数' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '补全采纳次数' })).toBeVisible();
  });

  // -------------------- 页面导航 --------------------

  test('页面导航 - 从团队数据切换到成员数据', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('link', { name: '成员数据' }).click();
    await expect(page).toHaveURL(/.*\/user-statistics/);
  });

  test('页面导航 - 从团队数据切换到采纳反馈', async ({ page }) => {
    await page.goto(`${BASE_URL}${STATISTICS_PATH}`);

    await page.getByRole('link', { name: '采纳反馈' }).click();
    await expect(page).toHaveURL(/.*\/decision-feedback/);
  });
});
