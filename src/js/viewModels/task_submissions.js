define(['ojs/ojcore', 'knockout', "jquery", "./api", "ojs/ojarraydataprovider", 'ojs/ojpagingdataproviderview', "ojs/ojvalidation-base", 'ojs/ojmessages', "ojs/ojdialog",
"ojs/ojvalidation-datetime",
"ojs/ojlabel",
"ojs/ojinputtext",
"ojs/ojformlayout",
"ojs/ojselectcombobox",
"ojs/ojdatetimepicker",
"ojs/ojbutton",
'ojs/ojtable', 'ojs/ojoption', "ojs/ojtimezonedata"],
function(oj, ko, $, api, ArrayDataProvider, PagingDataProviderView, ValidationBase) {
function TaskSubmissionsModel(params) {
  var self = this;
  self.hideSubmissions = ko.observable();
  self.listRefresh = ko.observable();

  // Task submission observables
  self.title = ko.observable("");
  self.deadline = ko.observable("");
  self.submission_link = ko.observable("");
  self.submitted_on = ko.observable("");
  self.body = ko.observable("");
  self.is_active = ko.observable("");
  self.track = ko.observable("");
  self.submission_count = ko.observable("");

  self.editRow = ko.observable();

// extract the task ID we have to work with
  const task_id = params.taskModel().data.id;
  const track_id = params.taskModel().data.track_id;

  // notification messages observable
  self.applicationMessages = ko.observableArray([]);

  self.tracks = ko.observableArray([]);
  self.track_id = ko.observable();
  self.task = ko.observableArray([]);
  self.tasks = ko.observableArray([]);
  self.submissionId = ko.observable("");

  var tracksURL = `${api}/api/track`;
  var tasksURL = `${api}/api/task`;
  var submitURL = `${api}/api/submit`;

  var submissionURL = `${tasksURL}/${task_id}/submissions`;

  self.dataProvider = ko.observable()

  var userToken = sessionStorage.getItem("user_token");

  self.toTasks = () => {
    self.hideSubmissions(params.hideSubmissions(false));
    self.listRefresh(params.listRefresh());
  }

  self.deleteTaskModal = () => {
    document.getElementById("deleteTaskModal").open();
  };

  self.editTaskModal = () => {
    document.getElementById("editTaskModal").open();
  };

  self.deleteAllSubmissionModal = () => {
    document.getElementById("deleteAllSubmissionModal").open();
  };

  self.deleteSubmissionModal = function(event, context) {
    self.submissionId(context.row.id);
    document.getElementById("deleteSubmissionModal").open();
  };

  self.handleUpdate = function(event, context) {
    self.editRow({rowKey: context.key});
  };

  self.handleDone = function(event, context) {
    self.editRow({rowKey: null});
    var userId = context.row.user_id
    var grade = context.row.grade_score;
    var graded = 1;
    self.gradeTask(userId, grade, graded);
    };

    var numberConverterFactory = ValidationBase.Validation.converterFactory("number");
    self.numberConverter = numberConverterFactory.createConverter();

    // datetime converter
  self.formatDateTime = date => {
    var formatDateTime = oj.Validation.converterFactory(
      oj.ConverterFactory.CONVERTER_TYPE_DATETIME
    ).createConverter({
      formatType: "datetime",
      dateFormat: "medium",
      timeFormat: "short",
      timeZone: "Africa/Lagos"
    });

    var values = date.split(/[^0-9]/),
      year = parseInt(values[0], 10),
      month = parseInt(values[1], 10) - 1, // Month is zero based, so subtract 1
      day = parseInt(values[2], 10),
      hours = parseInt(values[3], 10),
      minutes = parseInt(values[4], 10),
      seconds = parseInt(values[5], 10);

    return formatDateTime.format(
      new Date(year, month, day, hours, minutes, seconds).toISOString()
    );
    // return formatDateTime.format(new Date(date).toISOString());
  };

  function fetchSubmission() {
        $.ajax({
          url: submissionURL,
          headers: {
            'Authorization': "Bearer " + userToken
          },
          method: "GET",

          success: ({status, data}) => {
            if (status == true) {
              if (data.comment === null){
                data.comment = 'No comment';
              }
              const submissions = data.filter(datum => datum.is_graded !== 1);
              self.dataProvider(new PagingDataProviderView(new ArrayDataProvider(submissions, {keyAttribute: 'user_id'})));
          }
        }
      });
    }


    fetchSubmission();

  function fetchTracks() {
    self.tracks([]);
    $.ajax({
      url: `${tracksURL}/list`,
      method: "GET",
      headers: {
        Authorization: "Bearer " + userToken
      },
      success: res => {
        let { data } = res.data;
        self.tracks(data.map(tracks => tracks));
      }
    });
  }

  fetchTracks();

  self.fetchTrack = async() => {
    try {
        const response = await fetch(`${api}/api/track/${track_id}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });
        const { data } = await response.json();

        self.track(`${data.track_name}`);
    } catch (err) {
        console.log(err);
    }
};
self.fetchTrack();

self.gradeTask = function(userId, grade, graded) {
  let grade_score = grade;
  let user_id = userId;
  let is_graded = graded;
  $.ajax({
    method: "POST",
    url: `${api}/api/user/task/${task_id}`,
    headers: {
      Authorization: "Bearer " + userToken
        },
    data: { grade_score, user_id, is_graded },
    success: res => {
        fetchSubmission();
    },
    error: err => {
      console.log(err);
    }
  });
}

  //Updates Task

  self.updateTask = function(event) {
    let track_id = self.track_id();
    let title = self.title();
    let body = self.body();
    let deadline = self.deadline();
    let is_active = self.is_active();
  

    $.ajax({
      method: "PUT",
      url: `${tasksURL}s/${task_id}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + userToken
      },
      data: { track_id, title, body, deadline, is_active },
      success: res => {
          self.fetchTask();
          self.fetchTrack();
          self.applicationMessages.push({
            severity: "confirmation",
            summary: "Task updated",
            detail: "Task successfully updated",
            autoTimeout: parseInt("0")
          });
      },
      error: err => {
        console.log(err);
        self.applicationMessages.push({
          severity: "error",
          summary: "Error updating task",
          detail: "Error trying to update task",
          autoTimeout: parseInt("0")
        });
      }
    });

    document.getElementById("editTaskModal").close();
  };

  self.deleteTask = async() => {
    try {
      const response = await fetch(`${tasksURL}s/${task_id}`,{
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`
        }
      });
      self.listRefresh(params.listRefresh());
      setTimeout(() => self.hideSubmissions(params.hideSubmissions(false)), 1000);
      document.getElementById("deleteTaskModal").close();
      self.applicationMessages.push({
        severity: "confirmation",
        summary: "Task deleted",
        detail: `Successfully deleted task`,
        autoTimeout: parseInt("0")
      });
    } catch (err) {
      console.log(err);
      self.applicationMessages.push({
        severity: "error",
        summary: "Error deleting task",
        detail: "An error was encountered, could not delete task",
        autoTimeout: parseInt("0")
      });
    }
  }

self.deleteAllSubmission = async () => {
  try {
    const response = await fetch(`${api}/api/submissions/task/${task_id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`
      }
    });
    fetchSubmission();
    self.fetchTask();
    document.getElementById("deleteAllSubmissionModal").close();
    self.applicationMessages.push({
      severity: "confirmation",
      summary: "Submissions deleted",
      detail: "Successfully deleted all submissions for this task",
      autoTimeout: parseInt("0")
    });
  } catch (err) {
    console.log(err);
    self.applicationMessages.push({
      severity: "error",
      summary: "Error deleting all submissions",
      detail: "An error was encountered, could not delete submissions",
      autoTimeout: parseInt("0")
    });
  }
}

self.deleteSubmission = async () => {
  let submission_id = self.submissionId();
  try {
    const response = await fetch(`${api}/api/submissions/${submission_id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`
      }
    });
    fetchSubmission();
    self.fetchTask();
    document.getElementById("deleteSubmissionModal").close();
    self.applicationMessages.push({
      severity: "confirmation",
      summary: "Submission deleted",
      detail: "Task submission deleted",
      autoTimeout: parseInt("0")
    });
  } catch (err) {
    console.log(err);
    self.applicationMessages.push({
      severity: "error",
      summary: "Error deleting submission",
      detail: "An error was encountered, could not delete submission",
      autoTimeout: parseInt("0")
    });
  }
}



  self.fetchTask = async() => {
    try {
      const response = await fetch(`${tasksURL}/${task_id}`, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      const { data } = await response.json();

      self.title(`${data[0].title}`);
      self.body(`${data[0].body}`);
      self.deadline(self.formatDateTime(`${data[0].deadline}`));
      self.is_active(`${data[0].is_active}`);
      self.submission_count(`${data[0].submissions.filter(e => e.is_submitted == 1).length > 0 ? data[0].submissions.filter(e => e.is_submitted == 1).length : ''}`);
    } catch (err) {
      console.log(err);
    }
  };
  self.fetchTask();
}

return TaskSubmissionsModel;
});