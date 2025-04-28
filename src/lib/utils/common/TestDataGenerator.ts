import { AirlineModule, faker } from '@faker-js/faker';
import * as path from 'path';
import * as fs from 'fs';
import * as xlsx from 'xlsx';

interface TestCaseData {
    [key: string]: string;
};

// A function to map column names to faker.js generators
export const fakerjsMapper = {
    firstName: faker.person.firstName,
    lastName: faker.person.lastName,
    middleName: faker.person.middleName,
    fullName: faker.person.fullName,
    gender: faker.person.gender,
    sex: faker.person.sex,
    jobArea: faker.person.jobArea,
    jobDescription: faker.person.jobDescriptor,
    jobTitle: faker.person.jobTitle,
    jobType: faker.person.jobType,
    prefix: faker.person.prefix,
    suffix: faker.person.suffix,
    bio: faker.person.bio,
    email: faker.internet.email,
    exampleEmail: faker.internet.exampleEmail,
    username: faker.internet.username,
    password: faker.internet.password,
    userAgent: faker.internet.userAgent,
    buildingNumber: faker.location.buildingNumber,
    cardinalDirection: faker.location.cardinalDirection,
    city: faker.location.city,
    continent: faker.location.continent,
    country: faker.location.country,
    direction: faker.location.direction,
    ordinalDirection: faker.location.ordinalDirection,
    secondaryAddress: faker.location.secondaryAddress,
    state: faker.location.state,
    street: faker.location.street,
    streetAddress: faker.location.streetAddress,
    timezone: faker.location.timeZone,
    zipCode: faker.location.zipCode,
    productName: faker.commerce.productName,
    productDescription: faker.commerce.productDescription,
    productPrice: faker.commerce.price,
    productCategory: faker.commerce.department,
    date: faker.date.past,
    number: faker.number.int,
    word: faker.lorem.word,
    string: faker.string.alpha,
    systemFileName: faker.system.fileName,
    phoneNumber: faker.phone.number,
    boolean: faker.datatype.boolean,
    column: faker.database.column,
    type: faker.database.type,
    collation: faker.database.collation,
    engine: faker.database.engine,
    companyName: faker.company.name,
    catchPhrase: faker.company.catchPhrase,
    catchPhraseAdjective: faker.company.catchPhraseAdjective,
    catchPhraseDescriptor: faker.company.catchPhraseDescriptor,
    catchPhraseNoun: faker.company.catchPhraseNoun,
    accountName: faker.finance.accountName,
    routingNumber: faker.finance.routingNumber,
    amount: faker.finance.amount,
    transactionType: faker.finance.transactionType,
    currencyCode: faker.finance.currencyCode,
    currencyName: faker.finance.currencyName,
    currencySymbol: faker.finance.currencySymbol,
    bitcoinAddress: faker.finance.bitcoinAddress,
    litecoinAddress: faker.finance.litecoinAddress,
    creditCardNumber: faker.finance.creditCardNumber,
    creditCardCVV: faker.finance.creditCardCVV,
    ethereumAddress: faker.finance.ethereumAddress,
    iban: faker.finance.iban,
    bic: faker.finance.bic,
};


export async function generateDynamicFakerjsDataForTestCase (fileName: string, sheetName: string, testCaseName: string, outputFilePath: string)  {
    const filePath = path.resolve(__dirname, '../../../src/data', fileName);
    const workbook = xlsx.readFile(filePath); // Read the Excel file
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Convert sheet data into JSON format with headers

    const headers = data[0]; // Get the column names from the first row
    const updatedData = data.slice(1).map((row: string[]) => {
        const updatedRow: TestCaseData = {};
        headers.forEach((header, index) => {
            const key = header.toLowerCase();
            if (fakerjsMapper[key]) {
                updatedRow[header] = fakerjsMapper[key](); // If a faker function exists for this column, use it to generate data
            } else {
                updatedRow[header] = row[index]; // If no faker function exists, retain the original value
            }
        });
        return updatedRow;
    });

    const updatedSheet = xlsx.utils.json_to_sheet([headers, ...updatedData]); // Convert the updated data back to Excel sheet format
    workbook.Sheets[`${sheetName}_fakerjs`] = updatedSheet; // Create a new sheet with the updated data

    // Write the updated workbook to the output file
    xlsx.writeFile(workbook, outputFilePath);
    console.log('Excel file generated and updated successfully!');
};

interface Person {
    firstName: string;
    lastName: string;
    middleName: string;
    fullName: string;
    gender: string;
    sex: string;
    jobArea: string;
    jobDescription: string;
    jobTitle: string;
    jobType: string;
    prefix: string;
    suffix: string;
    bio: string;
};

interface Internet {
    email: string;
    exampleEmail: string;
    username: string;
    password: string;
    userAgent: string;
};

interface Location {
    buildingNumber: string;
    cardinalDirection: string;
    city: string;
    continent: string;
    country: string;
    direction: string;
    ordinalDirection: string;
    secondaryAddress: string;
    state: string;
    street: string;
    streetAddress: string;
    timezone: string;
    zipCode: string;
};

interface Phone {
    phoneNumber: string;
    phoneNumberFormat: string;
    phoneFormats: string;
};

interface Datatype {
    number: number;
    float: number;
    datetime: Date;
    string: string;
    uuid: string;
    boolean: boolean;
    json: object;
};

interface Database {
    column: string;
    type: string;
    collation: string;
    engine: string;
};

interface Company {
    companyName: string;
    companySuffix: string;
    catchPhrase: string;
    bs: string;
    catchPhraseAdjective: string;
    catchPhraseDescriptor: string;
    catchPhraseNoun: string;
    bsAdjective: string;
    bsBuzz: string;
    bsNoun: string;
};

interface Finance {
    account: string;
    accountName: string;
    routingNumber: string;
    mask: string;
    amount: number;
    transactionType: string;
    currencyCode: string;
    currencyName: string;
    currencySymbol: string;
    bitcoinAddress: string;
    litecoinAddress: string;
    creditCardNumber: string;
    creditCardCVV: string;
    ethereumAddress: string;
    iban: string;
    bic: string;
};

interface Helpers {
    randomize: string;
    slugify: string;
    replaceSymbolWithNumber: string;
    replaceSymbols: string;
    replaceCreditCardSymbols: string;
    repeatString: string;
    regexpStyleStringParse: string;
    shuffle: string;
    mustache: string;
    createCard: object;
    contextualCard: object;
    userCard: object;
    createTransaction: object;
};

export const PersonFakerjsData = (count: number) => {
    const users: Person[] = [];
    for (let i = 0; i < count; i++) {
        users.push({
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            fullName: faker.person.fullName(),
            gender: faker.person.gender(),
            jobArea: faker.person.jobArea(),
            middleName: faker.person.middleName(),
            sex: faker.person.sex(),
            jobDescription: faker.person.jobDescriptor(),
            jobTitle: faker.person.jobTitle(),
            jobType: faker.person.jobType(),
            prefix: faker.person.prefix(),
            suffix: faker.person.suffix(),
            bio: faker.person.bio(),
        });
    }
    return users;
    // fs.writeFileSync('src/data/ExcelTestData.xlsx', JSON.stringify(users));
};

export const UserCredsFakerjsData = (count: number) => {
    const creds: Internet[] = [];
    for (let i = 0; i < count; i++) {
        creds.push({
            email: faker.internet.email(),
            exampleEmail: faker.internet.exampleEmail(),
            username: faker.internet.username(),
            password: faker.internet.password(),
            userAgent: faker.internet.userAgent(),
        });
    };
    return creds;
    // fs.writeFileSync('src/data/ExcelTestData.xlsx', JSON.stringify(creds));
};

export const LocationFakerjsData = (count: number) => {
    const location: Location[] = [];
    for (let i = 0; i < count; i++) {
        location.push({
            buildingNumber: faker.location.buildingNumber(),
            cardinalDirection: faker.location.cardinalDirection(),
            city: faker.location.city(),
            continent: faker.location.continent(),
            country: faker.location.country(),
            direction: faker.location.direction(),
            ordinalDirection: faker.location.ordinalDirection(),
            secondaryAddress: faker.location.secondaryAddress(),
            state: faker.location.state(),
            street: faker.location.street(),
            streetAddress: faker.location.streetAddress(),
            timezone: faker.location.timeZone(),
            zipCode: faker.location.zipCode(),
        });
    };
    return location;
    // fs.writeFileSync('src/data/ExcelTestData.xlsx', JSON.stringify(location));
};

export const CommerceFakerjsData = () => {
    return {
        productName: faker.commerce.productName(),
        productDescription: faker.commerce.productDescription(),
        productPrice: faker.commerce.price(),
        productCategory: faker.commerce.department(),
    };
};

// Function to generate random data dynamically based on a template
export const FakerjsDefaultModulesData = (module: string, count: number) => {
    const data = {};
    Object.keys(module).forEach(key => {
        switch (module[key]) {
            case 'person':
                data[key] = PersonFakerjsData(count);
                break;
            case 'internet':
                data[key] = UserCredsFakerjsData(count);
                break;
            default:
                data[key] = faker.lorem.word();
        }
    });
    return data;
};

