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
    }
  },
  methods: {
    eventListener: function (event) {
      let message = event.data;

      if (message.command == "Set") {
        for (let [key, value] of Object.entries(message.data)) {
          this.task[key] = value
        }
      }
    },
    addTask: function () {
      vscode.postMessage({
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
})