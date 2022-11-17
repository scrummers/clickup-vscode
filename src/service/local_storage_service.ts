import { Memento } from 'vscode'
import { EnumLocalStorage } from '../util/typings/system'

const storageKey = Object.values(EnumLocalStorage)
class LocalStorageService {
  private storage: Memento

  constructor(memento: Memento) {
    this.storage = memento
  }

  public clearAll() {
    console.log('all storage data deleted')
    storageKey.forEach((key) => this.deleteValue(key))
  }

  public deleteValue(key: string) {
    // console.log(`[Storage Delete]: ${key}`) // Debug
    return this.storage.update(key, undefined)
  }

  public getValue(key: string): Object | string {
    let value = this.storage.get(key) || ''
    try {
      value = JSON.parse(value as any)
    } catch {}
    // console.log(`[Storage GET]: ${key}`) // Debug
    return value
  }

  public setValue(key: string, value: any) {
    const isObjType = typeof value !== 'string'
    const _value = isObjType ? JSON.stringify(value) : value
    // console.log(`[Storage SET]: ${key} => ${_value}`) // Debug
    return this.storage.update(key, _value)
  }
}

export { LocalStorageService }
