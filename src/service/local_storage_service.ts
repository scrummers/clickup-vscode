import { Memento } from 'vscode'

class LocalStorageService {
  private storage: Memento

  constructor(memento: Memento) {
    this.storage = memento
  }

  public async deleteValue(key: string) {
    console.log(`LocalStorageService - Delete: ${key}`) // Debug

    await this.storage.update(key, undefined)
  }

  public async getValue(key: string): Promise<any> {
    console.log(`LocalStorageService - Get: ${key}`) // Debug

    return await this.storage.get(key)
  }

  public async setValue(key: string, value: any) {
    console.log(`LocalStorageService - Set: ${key} - ${value}`) // Debug

    await this.storage.update(key, value)
  }

  public async getObjectValue(key: string) {
    console.log(`LocalStorageService - Get: ${key}`) // Debug

    const val = this.storage.get<string>(key)
    if (!val) {
      return
    }
    return JSON.parse(val)
  }

  public async setObjectValue(key: string, value: Object) {
    console.log(`LocalStorageService - Set: ${key}`) // Debug

    await this.storage.update(key, JSON.stringify(value))
  }
}

export { LocalStorageService }
