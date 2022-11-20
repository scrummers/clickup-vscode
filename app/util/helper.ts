import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

export const getDate = (timestamp?: number, humanRead?: boolean): string => {
    if (humanRead) {
        return dayjs(timestamp).utc().local().format('DD/MM/YYYY, HH:mm A')
    }
    return dayjs(timestamp).utc().local().format('YYYY-MM-DDTHH:mm')
}

export const getMinute = (timestamp: number): string => {
    return dayjs(timestamp).minute + ''
}

export const filterArray = <T>(array: T[], object: T, key: keyof T): T[] => {
    var index = array.findIndex(o => o[key] === object[key]);
    if (index === -1) array.push(object);
    else array.splice(index, 1);
    return array;
}

export const getNameById = <T>(array: T[], checkKey: keyof T, returnField: keyof T, value: string | number): any => {
    const r = array.find((o) => o[checkKey] === value)
    return r ? r[returnField] : null
} 