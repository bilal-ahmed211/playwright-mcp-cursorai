import { ExcelFileReader } from "./ExcelFileReader";

const excelDataReader = new ExcelFileReader();
let dataSource: Record<string, any>;

export async function setStaticTestCaseDataFromExcel(fileName: string, sheetName: string, testcaseName: string) {
    dataSource = await excelDataReader.getExceltData(fileName, sheetName, testcaseName);
}

export function getTestCaseData(key?: string) {
    if (key) {
        return dataSource[key as keyof typeof dataSource]
    }
    return dataSource;
}

export function updateTestCaseKeyValue(key: string, value: string) {
    dataSource[key] = value;
}  

export function updateExcelDataValues(updates: { [key: string]: string }) {
    for (const [key, value] of Object.entries(updates)) {
        dataSource[key] = value;
    }
}