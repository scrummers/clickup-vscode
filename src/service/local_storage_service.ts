import { Memento } from "vscode";

export class LocalStorageService {
  constructor(private storage: Memento) {
    this.storage = storage;
  }

  public async deleteValue(key: string) {
    console.log(`LocalStorageService - Delete: ${key}`); // Debug
    await this.storage.update(key, undefined);
  }

  public async getValue(key: string): Promise<any> {
    console.log(`LocalStorageService - Get: ${key}`);  // Debug
    return await this.storage.get(key);
  }

  public async setValue(key: string, value: any) {
    console.log(`LocalStorageService - Set: ${key} - ${value}`);  // Debug
    await this.storage.update(key, value);
  }
}