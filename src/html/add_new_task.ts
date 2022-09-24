function getAddNewTaskView(): string {
  return `
    <html>
      <head>
      </head>
      <body>
        <h1>Add New Task</h1>
        <div>
          <label for="task_name">Task name:</label>
          <input type="text" id="input_task_name" name="input_task_name">
          <br><br>
          <label for="issue">Issue:</label>
          <input type="text" id="input_issue" name="input_issue">
          <br><br>
          <button onClick="testing()">Add Task</button>
        </div>
        <script>
          const vscode = acquireVsCodeApi();

          function testing() {
            const input_task_name = document.getElementById("input_task_name");
            const input_issue = document.getElementById("input_issue");

            vscode.postMessage({
              command: "addTask",
              data: {
                taskName: "",
                issue: ""
              }
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