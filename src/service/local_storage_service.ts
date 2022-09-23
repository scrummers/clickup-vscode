import { Memento } from "vscode";

export class LocalStorageService {
  constructor(private storage: Memento) {
    this.storage = storage;
  }

  public async getValue(key: string): Promise<any> {
    return await this.storage.get(key);
  }

  public async setValue(key: string, value: any) {
    await this.storage.update(key, value);
  }
}