
export type MessageType = 'RELOAD' | 'COMMON' | 'UPDATE' | 'CREATE' | 'CLOSE' | 'INIT';
export interface Message {
    type: MessageType;
    payload?: any;
}

export interface Message {
    type: MessageType;
    payload?: any;
}

export interface CommonMessage extends Message {
    type: 'COMMON';
    payload: string;
}

export interface UpdateTaskMessage extends Message {
    type: 'UPDATE';
    payload: string;
}

export interface InitMessage extends Message {
    type: 'INIT';
    payload: string;
}
export interface CloseMessage extends Message {
    type: 'CLOSE';
}

export interface CreateTaskMessage extends Message {
    type: 'CREATE';
    payload: string;
}

export interface ReloadMessage extends Message {
    type: 'RELOAD';
}