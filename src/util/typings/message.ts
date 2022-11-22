export enum EnumMessageType {
    Reload,
    Common,
    Update,
    Create,
    Close,
    Init,
    Delete
}
export interface Message {
    type: EnumMessageType;
    payload?: string;
}
