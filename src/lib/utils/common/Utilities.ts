import { join, isAbsolute } from 'path'
import * as fs from 'fs';
import * as path from 'path';

export function getOsEnv(key: string): any {
    return process.env[key];
}

export function getOsEnvObj(key: string): any {
    return JSON.parse(process.env[key] || '{}');
}

export function getOsEnvRegex(key: string): any {
    return (process.env[key] && new RegExp(process.env[key].slice(1, -1))) || false;
}

export function getPath(path: string): string {
    return process.env.NODE_ENV === 'production'
        ? join(process.cwd(), path.replace('src/', 'dist/src/').slice(0, -3) + '.js')
        : join(process.cwd(), path);
}

export function getPaths(paths: any): string[] {
    return paths.map((p): string => getPath(p))
}

export function getOsPath(key: any): string {
    const path = getOsEnv(key);
    return path && getPath(path);
}

export function getOsPaths(key: any): any {
    const paths = getOsEnvArray(key) || [];
    if (paths.length) {
        return getPaths(paths)
    }
}

export function getOsEnvArray(key: any, delimiter: string = ','): string[] {
    return process.env[key]?.split(delimiter) || [];
}

export function getAbsolutePath(userProvidedPath: string): string {
    return isAbsolute(userProvidedPath) ? userProvidedPath : join(process.cwd(), userProvidedPath);
}


export function normalizePort(port: string): number | string | boolean {
    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort)) {
        return port;
    }
    if (parsedPort >= 0) {
        return parsedPort;
    }
    return false;
}

export function toBool(value: string): boolean {
    return value === 'true';
}

export const isEmpty = (value: any): boolean => {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0)
    )
}

export const toCamelCase = (key: string): string => {
    return key
        .replace(/\s+(.)/g, (match, group): any => {
            return match ? group.toUpperCase() : group.toUpperCase();
        })
        ?.replace(' ', '');
}

export const getValue = (
    object: any,
    keys: string[] | string,
    defalutVal?: any
): any => {
    keys = Array.isArray(keys) ? keys : keys.split('.');

    if (keys[0].includes('[')) {
        const index = keys[0].indexOf('[');
        const subStr1 = keys[0].substring(0, index);
        const subStr2 = keys[0].substring(index + 1, index + 2);

        object = object[subStr1][subStr2];
    } else {
        object = object[keys[0]];
    }

    if (object && keys.length > 1) {
        return getValue(object, keys.slice(1), defalutVal);
    }

    if (object === undefined) {
        return defalutVal;
    }
    console.log('Key Saved from response', object);
    return object;
}
