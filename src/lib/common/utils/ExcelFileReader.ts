import xlsx from 'xlsx';
// import {fakerjsMapper} from './TestDataGenerator'
const path = require('node:path');

interface TestCaseData {
    [key: string]: string;
};

export class ExcelFileReader { 
    filePath: any;
    workbook: any;
    sheetNames: any;
    data: any;
    record: any;
    constructor() { }

    public async getExceltData(fileName: string, sheetName: string, testCaseName: string) {
        this.filePath = path.resolve(__dirname, '../../../src/data', fileName);
        this.workbook = xlsx.readFile(this.filePath);
        this.sheetNames = await this.workbook.SheetNames;

        for (const key in this.sheetNames) {
            if (this.sheetNames[key] == sheetName) {
                this.data = await xlsx.utils.sheet_to_json(this.workbook.Sheets[sheetName]) as TestCaseData[];
                this.data.find((item: TestCaseData) => item.TestCaseName == testCaseName);
            }
        }
        this.record = this.data.find((item: TestCaseData) => item.TestCaseName == testCaseName);
        this.record = JSON.parse(JSON.stringify(this.record).replace(/"\s+|\s+"/g, '"'));
        return this.record;
    }

}

