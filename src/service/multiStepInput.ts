
import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import { MultStepGroup } from '../util/const';

export async function multiStepInput(context: ExtensionContext, multi_step_in: MultStepGroup) {
/*
	class MyButton implements QuickInputButton {
		constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
	}

	const createResourceGroupButton = new MyButton({
		dark: Uri.file(context.asAbsolutePath('./resources/dark/new.svg')),
		light: Uri.file(context.asAbsolutePath('./resources/light/new.svg')),
	}, 'Create Resource Group');
*/
	async function collectInputs() {
		const state : State = {title:'', step:1, totalSteps:0, name:''};
		state.totalSteps = multi_step_in.multi_quene.length;		
		await MultiStepInput.run(input => GeneralResource(input, state, multi_step_in), state);
		return state as State;
	}

	async function GeneralResource(input: MultiStepInput, state:State, multi_step_in: MultStepGroup) {
		let ptr = state.step - 1;
		const items : QuickPickItem[]= multi_step_in.multi_quene[ptr].items.map(label => ({ label }));
		const title_in : string = multi_step_in.multi_quene[ptr].title;
		const placeHolder:any =  multi_step_in.multi_quene[ptr].placeholder
		let pick : any
		if(multi_step_in.multi_quene[ptr].inputBox_Set == false){
			pick= await input.showQuickPick({
				title: title_in,
				step: state.step,
				totalSteps: state.totalSteps,
				placeholder: placeHolder,
				items: items,
				shouldResume: shouldResume
			});
			multi_step_in.return_label[ptr] = pick.label;
		}
		else{
			let prompt : any = multi_step_in.multi_quene[ptr].prompt;
			pick = await input.showInputBox({
				title: title_in,
				step: state.step,
				totalSteps: state.totalSteps,
				value: '',
				prompt: prompt,
				shouldResume: shouldResume
			});
			multi_step_in.return_label[ptr] = pick;
		}
		if(state.step < multi_step_in.multi_quene.length){
			state.step++;
			return (input: MultiStepInput) => GeneralResource(input, state, multi_step_in);
		}
	}

	function shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}

	const state = await collectInputs();
	window.showInformationMessage(`Creating Application Service '${multi_step_in.return_label}'`);
}


interface State{
	title: string;
	step: number;
	totalSteps: number;
	name: string;
}
// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
	title: string;
	step: number;
	totalSteps: number;
	items: T[];
	activeItem?: T;
	placeholder?: string;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
//	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

	static async run<T>(start: InputStep, state: State) {
		const input = new MultiStepInput();
		return input.stepThrough(start, state);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];

	private async stepThrough<T>(start: InputStep, state: State) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					state.step--;
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidChangeSelection(items => resolve(items[0])),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				//let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						//input.enabled = false;
						//input.busy = true;
						//if (!(await validate(value))) {
					//		resolve(value);
					//	}
						resolve(value);
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						/*
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
						*/
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}