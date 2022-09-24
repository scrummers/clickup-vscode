function getAddNewTaskView(): string {
  return `
    <html>
      <head>
      </head>
      <body>
        <h1>Add New Task</h1>
        <button onClick="testing()">Add Task</button>
        <script>
          const vscode = acquireVsCodeApi();

          function testing() {
            console.log("hi");
            vscode.postMessage({
              command: "addTask",
              text: "hi"
            });
          }
        </script>
      </body>
    </html>
  `;
}

function getEditTaskView(): string {
  return `
    <html>
    <body>
      <h1>Edit Task</h1>
    </body>
    </html>
  `;
}

export { getAddNewTaskView, getEditTaskView };