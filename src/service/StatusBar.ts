import { AppState, appStateChangeEventEmitter } from '../store'
import { Command, Event, StatusBarAlignment, StatusBarItem, ThemeColor, window } from 'vscode'
import { Commands } from '../commands'

enum StatusBarItemColor {
  Warning = 'statusBarItem.warningBackground',
  Error = 'statusBarItem.errorBackground',
}

abstract class CustomStatusBarItem {
  private _id: string
  protected _item: StatusBarItem

  constructor(id: string, align: StatusBarAlignment = StatusBarAlignment.Left, priority: number = 0) {
    this._id = id
    this._item = window.createStatusBarItem(align, priority)
  }

  // To be implement by each subclass inheriting `CustomStatusBarItem`
  public abstract update(): void

  public get id(): string {
    return this._id
  }

  protected setText(text: string) {
    this._item.text = text
  }

  protected setCommand(command: string | Command | undefined) {
    this._item.command = command
  }

  protected setBackgroundColor(color: StatusBarItemColor | undefined) {
    if (color !== undefined) {
      this._item.backgroundColor = new ThemeColor(color)
    } else {
      this._item.backgroundColor = undefined
    }
  }

  protected show() {
    this._item.show()
  }

  protected hide() {
    this._item.hide()
  }

  protected dispose() {
    this._item.dispose()
  }
}

class LoadingStatusBarItem extends CustomStatusBarItem {
  constructor(id: string, align: StatusBarAlignment = StatusBarAlignment.Left, priority: number = 0) {
    super(id, align, priority)
  }

  public update(): void {
    if (!AppState.me) {
      this.hide()
      return
    }

    if (AppState.isLoading) {
      this.setText('$(loading~spin) ClickUp: Loading...')
      this.show()
    } else {
      this.hide()
    }
  }
}

class UserStatusBarItem extends CustomStatusBarItem {
  constructor(id: string, align: StatusBarAlignment = StatusBarAlignment.Left, priority: number = 0) {
    super(id, align, priority)
  }

  public update(): void {
    // init stage
    if (AppState.me === null && AppState.isLoading) {
      this.hide()
      return
    }

    if (AppState.me !== null) {
      this.setText(`$(account) ${AppState.me?.username}`)
      this.setCommand(Commands.ClickupAccount)
      this.setBackgroundColor(undefined)
    } else {
      this.setText('$(key) Set Up ClickUp API Token')
      this.setCommand(Commands.ClickupSetToken)
      this.setBackgroundColor(StatusBarItemColor.Error)
    }
    this.show()
  }
}

class SpaceStatusBarItem extends CustomStatusBarItem {
  constructor(id: string, align: StatusBarAlignment = StatusBarAlignment.Left, priority: number = 0) {
    super(id, align, priority)
  }

  public update(): void {
    // init stage
    if ((AppState.crntSpace === null && AppState.isLoading) || !AppState.me) {
      this.hide()
      return
    }

    this.setCommand(Commands.ClickupSelectWorkspace)
    if (AppState.crntSpace !== null) {
      this.setText(`$(briefcase) ${AppState?.crntWorkspace?.name}/${AppState?.crntSpace.name}`)
      this.setBackgroundColor(undefined)
    } else {
      this.setText(`$(warning) No ClickUp Space Selected`)
      this.setBackgroundColor(StatusBarItemColor.Warning)
    }
    this.show()
  }
}

export class StatusBarService {
  private _onDidAppStateChange: Event<void>
  private userStatusItems: UserStatusBarItem
  private loadingStatusItems: LoadingStatusBarItem
  private spaceStatusBarItem: SpaceStatusBarItem

  constructor() {
    this._onDidAppStateChange = appStateChangeEventEmitter.event
    this._onDidAppStateChange(this.updateStatusBarItems, this)
    this.userStatusItems = new UserStatusBarItem('clickup.username', StatusBarAlignment.Left, 3)
    this.spaceStatusBarItem = new SpaceStatusBarItem('clickup.space', StatusBarAlignment.Left, 2)
    this.loadingStatusItems = new LoadingStatusBarItem('clickup.loading', StatusBarAlignment.Left, 1)
    this.updateStatusBarItems()
  }

  private updateStatusBarItems() {
    // console.log('[StatusBarItems]: Listener Invoked')
    this.userStatusItems.update()
    this.spaceStatusBarItem.update()
    this.loadingStatusItems.update()
    // console.log('[StatusBarItems]: Listener End')
  }
}
