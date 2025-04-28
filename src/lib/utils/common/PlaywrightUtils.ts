import { test, expect } from '@playwright/test'
import * as path from 'path'

const assets_folder = 'src/data/assets';

export const toHover = async (page: any, element: any): Promise<void> => {
    await page.locator(element).waitFor({ state: 'visible' });
    await page.locator(element).hover();
};

export const doublClick = async (page: any, element: any): Promise<void> => {
    await page.locator(element).waitFor({ state: 'visible' });
    return await page.locator(element).dblclick();
}

export const sendKeyboardKeys = (page: any, key: string): Promise<void> => {
    return page.keyboard.press(key);
}

export const clickByElementLocator = async (page: any, locatorKey: any): Promise<void> => {
    console.log('locatorKey is::', locatorKey);
    await page.locator(locatorKey).waitFor({ state: 'visible' });
    await page.locator(locatorKey).click();
}

export const clickByElementText = async (page: any, locatorKey: any): Promise<void> => {
    console.log('locatorKey is::', locatorKey);
    await page.getByText(locatorKey).click();
}

export const clickByElementRole = async (page: any, role: string, name: string): Promise<void> => {
    await page.getByRole(role, { name: name }).waitFor({ state: 'visible' });
    await page.getByRole(role, { name: name }).click();
}

export const fillElementByLocator = async (page: any, element: any, input: string): Promise<void> => {
    await page.locator(element).waitFor({ state: 'visible' });
    await page.locator(element).fill(input);
}

export const fillElementByText = async (page: any, element: any, index: any, input: string): Promise<void> => {
    await page.locator(element).waitFor({ state: 'visible' });
    await page.locator(element).fill(input);
}

export const fillElementByRole = async (page: any, role: string, name: string, index: any, input: string): Promise<void> => {
    await page.getByRole(role, {name: name}).waitFor({ state: 'visible' });
    await page.getByRole(role, {name: name}).fill(input);
}

export const fillElementByplaceholder = async (page: any, placeholder: string, input: string): Promise<void> => {
    await page.getByPlaceholder(placeholder).waitFor({ state: 'visible' });
    await page.getByPlaceholder(placeholder).fill(input);
}

export const fillElementByLabel = async (page: any, label: string, input: string): Promise<void> => {
    await page.getByLabel(label).waitFor({ state: 'visible' });
    await page.getByLabel(label).fill(input);
}

export const searchAndSelectFromDropdown = async (page: any, element: any, value: string): Promise<void> => {
    await fillElementByLocator(page, element, value);
    await page.getByRole('option', { name: value }).click();
}

export const selectValueFromDropdown = async (page: any, element: any, value: string): Promise<void> => {
    await checked(page, element);
    await page.getByRole('option', { name: value }).click();
}

export const checked = async (page: any, element: any): Promise<void> => {
    await page.locator(element).click();
}

export const uploadFile = async (page: any, element: any, value: string): Promise<void> => {
    const fileChooserPromise = await page.waitForEvent('filechooser');
    await clickByElementLocator(page, element);
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(assets_folder, value))

}

export const clickAndUpload = async (page: any, element: any, value: string): Promise<void> => {
    const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator(element).click()
    ])
    await fileChooser.setFiles(value);
}
export const assertElementIsVisible = async (page: any, element: any, role?: any, name?: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element) || await page.getByRole(element)).toBeVisible();
}

export const assertElementIsEnabled = async (page: any, element: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element)).toBeEnabled();
}

export const assertElementIsHidden = async (page: any, element: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element)).toBeHidden();
}

export const assertElementTextEquals = async (page: any, element: any, expectedValue: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element)).toEqual(expectedValue);
}

export const assertElementContainText = async (page: any, element: any, expectedValue: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element)).toContainText(expectedValue);
}

export const assertElementHaveValue = async (page: any, element: any, expectedValue: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element)).toHaveValue(expectedValue);
}

export const assertElementHaveValues = async (page: any, element: any, expectedValue: any): Promise<void> => {
    await expect(await page.getByText(element) || await page.locator(element)).toHaveValue(expectedValue);
}

export const textContent = async (page: any, element: any): Promise<string> => {
    return await page.locator(element).textConent();
}

export const innerText = async (page: any, element: any): Promise<string> => {
    return await page.locator(element).innerText();
}

export const inputValue = async (page: any, element: any): Promise<string> => {
    return await page.locator(element).inputValue();
}

export const getAttribute = async (page: any, element: any, attribute: string): Promise<string> => {
    return await page.locator(element).getAttribute(attribute);
}


