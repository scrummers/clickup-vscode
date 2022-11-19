type Message = import('../src/util/typings/message').Message;
type CommonMessage = import('../src/util/typings/message').CommonMessage;
type CreateTaskMessage = import('../src/util/typings/message').CreateTaskMessage;
type UpdateTaskMessage = import('../src/util/typings/message').UpdateTaskMessage;
type CloseMessage = import('../src/util/typings/message').CloseMessage;

type VSCode = {
  postMessage<T extends Message = Message>(message: T): void;
  getState(): any;
  setState(state: any): void;
};

type Task = import('../src/util/typings/clickup').Task

declare const vscode: VSCode;

declare const initRoute: string;
declare const initData: string;
