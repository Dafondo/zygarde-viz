'use strict';

let queryParamDict = {
  "duration": "d",
  "preemptive": "preempt",
  "powerMode": "power",
  "onTime": "onTime",
  "offTime": "offTime",
  "startState": "startState",
}

let duration = 30;
let preemptive = false;
let powerOptions = {
  mode: "periodic",
  onTime: 5,
  offTime: 2,
  startState: true,
}

let taskFields = [
  "color",
  "period",
  "deadline",
  "firstRelease",
  "mandatoryTime",
  "optionalTime",
  "optionalCredit",
]

let tasks = [
  {
    color: '#69a3f2',
    period: 10,
    deadline: 7,
    firstRelease: 0,
    mandatoryTime: 3,
    optionalTime: 2,
    optionalCredit: 1,
  },
  {
    color: '#45e49c',
    period: 14,
    deadline: 7,
    firstRelease: 3,
    mandatoryTime: 4,
    optionalTime: 1,
    optionalCredit: 1,
  },
]

/**
 * Turns tasks array into a parameter string
 * @returns a URI encoded string with the following format
 *          task_index=color,period,deadline,mandatory,optional,credit
 *
 */
let tasksToParam = () => {
  let paramString = "";

  tasks.forEach((task, i) => {
    // the key for the query param is the index of the task
    paramString += encodeURIComponent(i) + "=";

    // create comma-separated string of task values
    let paramValue = "";
    for (const [key, value] of Object.entries(task)) {
      paramValue += value + ",";
    }
    paramValue = paramValue.slice(0, -1); // remove extra comma

    paramString += encodeURIComponent(paramValue) + "&";
  });

  paramString = paramString.slice(0, -1); // remove extra ampersand

  return paramString;
}

/**
 * Creates a query parameter string and reloads the page with new parameters
 */
let reloadPageWithParams = () => {
  let params = `${queryParamDict["duration"]}=${encodeURIComponent(duration)}&`;
  params += `${queryParamDict["preemptive"]}=${encodeURIComponent(preemptive)}&`;
  params += `${queryParamDict["powerMode"]}=${encodeURIComponent(powerOptions.mode)}&`;
  params += `${queryParamDict["onTime"]}=${encodeURIComponent(powerOptions.onTime)}&`;
  params += `${queryParamDict["offTime"]}=${encodeURIComponent(powerOptions.offTime)}&`;
  params += `${queryParamDict["startState"]}=${encodeURIComponent(powerOptions.startState)}&`;
  params += tasksToParam()
  document.location.search = params;
}

/**
 * Adds a new task to the tasks array and reloads the page with new parameters
 * @param {} event form submit event
 */
let addNewTask = (event) => {
  event.preventDefault();

  let newTask = {
    color: document.getElementById("color").value,
    period: document.getElementById("period").value,
    deadline: document.getElementById("deadline").value,
    firstRelease: document.getElementById("first-release").value,
    mandatoryTime: document.getElementById("mandatory-time").value,
    optionalTime: document.getElementById("optional-time").value,
    optionalCredit: document.getElementById("credit").value,
  }

  tasks.push(newTask);

  reloadPageWithParams();
}

/**
 * Deletes a task from the task list and reloads the page with new parameters
 * @param {} event button click event
 */
let deleteTask = (event) => {
  let td = event.target.parentNode;
  let tr = td.parentNode;
  let index = Array.from(tr.parentNode.children).indexOf(tr);
  tasks.splice(index-1, 1);

  reloadPageWithParams();
}

let updatePowerForm = (event) => {
  let powerMode = powerOptions.mode;
  if (event) powerMode = event.target.value;
  if (powerMode === "periodic") {
    document.getElementById("on-time").removeAttribute("readonly");
    document.getElementById("off-time").removeAttribute("readonly");
  } else {
    document.getElementById("on-time").setAttribute("readonly", "");
    document.getElementById("off-time").setAttribute("readonly", "");
  }
}

let updateSettings = (event) => {
  event.preventDefault();

  duration = document.getElementById("duration").value;

  preemptive = document.getElementById("preemption").value === "preemptive";

  powerOptions.mode = document.getElementById("power").value;
  powerOptions.onTime = document.getElementById("on-time").value;
  powerOptions.offTime = document.getElementById("off-time").value;
  powerOptions.startState = document.getElementById("start-state").value === "on";

  reloadPageWithParams();
}

/**
 * Creates a disabled color input element of a specified color
 * @param {String} color hex string for color
 * @returns color input element with specified color and disabled
 */
let readOnlyColor = (color) => {
  let result = document.createElement("input");
  
  result.setAttribute("type", "color")
  result.setAttribute("disabled", "");

  result.className = "form-control form-control-color p-0"; // remove padding to make it look less like an input element
  result.value = color;
  
  return result;
}

/**
 * Checks if a string is a numeric value
 * @param {String} str 
 * @returns true if input is numeric, false otherwise
 */
let isNumeric = (str) => {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

/**
 * Here we read in url query params and use them to update the page
 */
const urlParams = new URLSearchParams(window.location.search);

/**
 * Update real time scheduling settings
 */
if (urlParams.has(queryParamDict["duration"])) duration = parseInt(urlParams.get(queryParamDict["duration"])); // only update duration if param exists
document.getElementById("duration").value = duration;

if (urlParams.has(queryParamDict["preemption"])) preemptive = urlParams.get(queryParamDict["preemption"]) === "true";
if (urlParams.has(queryParamDict["powerMode"])) powerOptions.mode = urlParams.get(queryParamDict["powerMode"]);
if (urlParams.has(queryParamDict["onTime"])) powerOptions.onTime = parseInt(urlParams.get(queryParamDict["onTime"]));
if (urlParams.has(queryParamDict["offTime"])) powerOptions.offTime = parseInt(urlParams.get(queryParamDict["offTime"]));
if (urlParams.has(queryParamDict["startState"])) powerOptions.startState = urlParams.get(queryParamDict["startState"]) === "true";
document.getElementById("preemption").value = preemptive ? "preemptive" : "nonpreemptive";
document.getElementById("power").value = powerOptions.mode;
document.getElementById("on-time").value = powerOptions.onTime;
document.getElementById("off-time").value = powerOptions.offTime;
document.getElementById("start-state").value = powerOptions.startState ? "on" : "off";
updatePowerForm(null);

/**
 * Update tasks
 */
urlParams.sort(); // sort so we push tasks in the correct order
let newTasks = [];
urlParams.forEach((value, key) => {
  if (isNumeric(key)) { // only parse numeric keys as tasks
    let values = value.split(",");
    let newTask = {};
    // TODO error check for values length
    for (let i = 0; i < Math.min(taskFields.length, values.length); i++) {
      newTask[taskFields[i]] = isNumeric(values[i]) ? parseInt(values[i]) : values[i];
    }
    newTasks.push(newTask);
  }
});

if (newTasks.length > 0) tasks = newTasks;

tasks.forEach((task, i) => {
  // Create new table row and add tasks
  let newRow = document.getElementById("task-table-body").insertRow();
  newRow.insertCell().innerText = i;

  for (const [key, value] of Object.entries(task)) {
    if (key === "color") newRow.insertCell().appendChild(readOnlyColor(value));
    else newRow.insertCell().innerText = value;
  };
  
  // Create a delete button for each row
  let deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-danger";
  deleteButton.innerText = "Delete";
  deleteButton.onclick = deleteTask;
  newRow.insertCell().appendChild(deleteButton);
})

// only update tasks if query params contain tasks
if (newTasks.length > 0) tasks = newTasks;

/**
 * Here we create all of the schedule charts
 */
// create the real time chart
let chartConstantEdf = realTimeChart()
    .title("Constant Power EDF")
    .yTitle("Y Scale")
    .xTitle("X Scale")
    .border(false)
    .width(1000)
    .height(250)
    .duration(duration)
    .tasks(tasks)
    .powerOptions({
      mode: 'constant',
    })
    .scheduleOptions({
      mode: 'edf',
      preemptive: preemptive,
    })
    ;

let chartInterEdf = realTimeChart()
    .title("Intermittent Power EDF")
    .yTitle("Y Scale")
    .xTitle("X Scale")
    .border(false)
    .width(1000)
    .height(250)
    .duration(duration)
    .tasks(tasks)
    .powerOptions(powerOptions)
    .scheduleOptions({
      mode: 'edf',
      preemptive: preemptive,
    })
    ;

let chartInterOptimal = realTimeChart()
    .title("Intermittent Power Optimal")
    .yTitle("Y Scale")
    .xTitle("X Scale")
    .border(false)
    .width(1000)
    .height(250)
    .duration(duration)
    .tasks(tasks)
    .powerOptions(powerOptions)
    .scheduleOptions({
      mode: 'optimal',
      preemptive: preemptive,
    })
    ;


// invoke the chart
d3.select("#constant-edf").append("div")
  .attr("id", "chart-constant-edf")
  .call(chartConstantEdf);

d3.select("#inter-edf").append("div")
  .attr("id", "chart-inter-edf")
  .call(chartInterEdf);

d3.select("#inter-optimal").append("div")
  .attr("id", "chart-inter-optimal")
  .call(chartInterOptimal);

document.getElementById("task-form").onsubmit = addNewTask;

document.getElementById("settings-form").onsubmit = updateSettings;

document.getElementById("power").onchange = updatePowerForm;
