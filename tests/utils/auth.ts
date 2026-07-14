import { expect, type Page } from '@playwright/test';

/**
 * aiXcoder 管理后台 - 通用登录工具函数
 *
 * 其他测试文件可以通过 import { login } from './utils/auth' 来复用
 * 本文件不包含任何 test() 调用，避免被 Playwright 误执行
 */

// ==================== 配置区域 ====================
const BASE_URL = 'http://192.168.1.159';
const LOGIN_PATH = '/page/auth/login';
const USERNAME = 'ai_leader';
const PASSWORD = 'Syw123456';

// ==================== 登录函数 ====================

export async function login(page: Page) {
  await page.goto(`${BASE_URL}${LOGIN_PATH}`);
  await page.getByRole('textbox', { name: '用户名' }).fill(USERNAME);
  await page.getByRole('textbox', { name: '密码' }).fill(PASSWORD);
  await page.getByRole('button', { name: '登录' }).click();
  // 等待跳转到管理后台
  await expect(page).toHaveURL(/.*\/agents/, { timeout: 15000 });
}
