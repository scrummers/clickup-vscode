const vscode = acquireVsCodeApi();

var app = new Vue({
  el: "#new-task",
  created: function () {
    window.addEventListener("message", this.eventListener);
  },
  destroyed: function () {
    window.removeEventListener("message", this.eventListener);
  },
  data: {
    title: "Add New Task",
    memberList: [],
    task: {
      taskName: "",
      taskLocation: "",
      assignTo: "",
      description: ""
    },
    errors: []
  },
  methods: {
    eventListener: function (event) {
      let message = event.data;

      if (message.command == "Set") {
        for (let [key, value] of Object.entries(message.data)) {
          this.task[key] = value;
        }
      }
    },
    addTask: function () {
      this.errors = []

      // Check errors
      if(!this.task.taskName) this.errors.push("Task name required");
      if(!this.task.taskLocation) this.errors.push("Task location required")

      if(!this.errors.length) vscode.postMessage({
        command: "addTask",
        data: {
          taskName: this.task.taskName,
          taskLocation: this.task.taskLocation,
          assignTo: this.task.assignTo,
          description: this.task.description
        }
      });
    },
    resetTask: function () {
      this.task = {
        taskName: "",
        taskLocation: "",
        assignTo: "",
        description: ""
      }
    }
  }
});