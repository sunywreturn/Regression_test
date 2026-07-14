import { test, expect } from '@playwright/test';

/**
 * aiXcoder 管理后台登录测试脚本
 *
 * 测试目标: http://192.168.1.159/
 * 登录账号: ai_leader / Syw123456
 */

// ==================== 配置区域 ====================
const BASE_URL = 'http://192.168.1.159';
const LOGIN_PATH = '/page/auth/login';
const USERNAME = 'ai_leader';
const PASSWORD = 'Syw123456';

// ==================== 登录测试 ====================

// 串行执行，避免并发登录导致服务端拒绝
test.describe.serial('aiXcoder 管理后台登录', () => {

  test('成功登录 - 验证跳转到管理后台', async ({ page }) => {
    // 1. 访问登录页面
    await page.goto(`${BASE_URL}${LOGIN_PATH}`);

    // 2. 验证页面标题
    await expect(page).toHaveTitle(/登录/);

    // 3. 验证登录表单元素存在
    await expect(page.getByRole('heading', { name: '登录到 aiXcoder' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '密码' })).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();

    // 4. 填写用户名和密码
    await page.getByRole('textbox', { name: '用户名' }).fill(USERNAME);
    await page.getByRole('textbox', { name: '密码' }).fill(PASSWORD);

    // 5. 点击登录按钮
    await page.getByRole('button', { name: '登录' }).click();

    // 6. 验证登录成功 - URL 应跳转至 /agents（增加超时和重试）
    await expect(page).toHaveURL(/.*\/agents/, { timeout: 15000 });
    await expect(page).toHaveTitle(/aiXcoder Console/);

    // 7. 验证用户名显示在页面上
    await expect(page.getByText('ai_leader')).toBeVisible();

    // 8. 验证侧边栏导航存在
    await expect(page.getByRole('link', { name: 'Agent 管理' })).toBeVisible();
  });

  test('登录失败 - 错误的密码', async ({ page }) => {
    await page.goto(`${BASE_URL}${LOGIN_PATH}`);

    await page.getByRole('textbox', { name: '用户名' }).fill(USERNAME);
    await page.getByRole('textbox', { name: '密码' }).fill('wrong_password');
    await page.getByRole('button', { name: '登录' }).click();

    // 验证仍然停留在登录页面
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('登录失败 - 空用户名', async ({ page }) => {
    await page.goto(`${BASE_URL}${LOGIN_PATH}`);

    // 只填写密码，不填写用户名
    await page.getByRole('textbox', { name: '密码' }).fill(PASSWORD);
    await page.getByRole('button', { name: '登录' }).click();

    // 验证仍然停留在登录页面
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('登录失败 - 空密码', async ({ page }) => {
    await page.goto(`${BASE_URL}${LOGIN_PATH}`);

    // 只填写用户名，不填写密码
    await page.getByRole('textbox', { name: '用户名' }).fill(USERNAME);
    await page.getByRole('button', { name: '登录' }).click();

    // 验证仍然停留在登录页面
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('登录后注销', async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}${LOGIN_PATH}`);
    await page.getByRole('textbox', { name: '用户名' }).fill(USERNAME);
    await page.getByRole('textbox', { name: '密码' }).fill(PASSWORD);
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/.*\/agents/);

    // 点击注销按钮
    await page.getByRole('button', { name: '注销' }).click();

    // 验证跳回登录页面
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});

