import * as assert from 'assert';
import { after } from 'mocha';
import { getDate } from '../../util//helper';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
  after(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
 
  test('GetDate test', () => {
    assert.equal('25/11/2022 @8:00am', getDate(1669334400000));
  });

});