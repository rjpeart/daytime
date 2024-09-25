var sunrise;
var sunset;
var daylight;
var nighttime;
var dayhours;
var nighthours;
var info;
var x;
var y;
var windowWidth;
var pixelThreshold = 0;
var lat;
var long;
var apiUrl;

// Function to fetch data from an API
function fetchData(url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            sunrise = convertTimeFormat(data.results.sunrise);
            sunset = convertTimeFormat(data.results.sunset);
            dayhours = calculateTimeDifference(sunrise, sunset);
            nighthours = calculateTimeDifference(sunset, sunrise);
            daylight = timeToPercentage(dayhours)
            nighttime = 100-daylight;
            console.log(nighttime)
            adjustWidth(daylight, nighttime)

            calculatePixelThreshold();

            const loading = document.getElementById('loading');
            loading.style.display = "none";

            window.addEventListener("mousemove", (e) => {
                moveInfo(e);
            });

            
            
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function convertTimeFormat(timeString) {
    // Create a Date object from the time string
    const date = new Date(`1970-01-01 ${timeString}`);
    
    // Format the hours and minutes
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Return the formatted time
    return `${hours}:${minutes}`;
}

function calculateTimeDifference(startTime, endTime) {
    // Parse the input times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    // Convert times to minutes
    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    // Handle cases where end time is on the next day
    if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60; // Add 24 hours in minutes
    }

    // Calculate the difference in minutes
    let differenceMinutes = endTotalMinutes - startTotalMinutes;

    // Convert back to hours and minutes
    const hours = Math.floor(differenceMinutes / 60);
    const minutes = differenceMinutes % 60;

    // Format the result
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function timeToPercentage(timeString) {
    // Split the time string into hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);

    // Calculate total minutes
    const totalMinutes = hours * 60 + minutes;

    // Calculate percentage (24 hours = 1440 minutes)
    const percentage = (totalMinutes / 1440) * 100;

    // Round to two decimal places
    return Math.round(percentage * 100) / 100;
}

function adjustWidth(dayWidth, nightWidth){
    const dayDiv = document.getElementById('day');
    const nightDiv = document.getElementById('night');

    dayDiv.style.width = dayWidth+"svw"
    nightDiv.style.width = nightWidth+"svw"

}

function calculatePixelThreshold(){
    windowWidth = window.innerWidth;
    console.log(daylight)
    var daylightMultiplier = daylight*0.01;
    pixelThreshold = windowWidth * daylightMultiplier
    console.log(pixelThreshold)
}

function moveInfo(e) {
    x = e.pageX,
    y = e.pageY
	TweenLite.to(info, 0.3, {
    css: {
      left: x,
      top: y
    }
  });
  updateInfo();
}

function updateInfo(){
    if(x<pixelThreshold){
        info.style.color = "#ffffff"
        info.innerHTML = `<p><span>&#9789;</span></p><p>Today</p><p>${nighthours} hours of night</p><p>${nighttime}%</p><p class='small'> Lat ${lat}, Long ${long}</p>`               
    } else {
            info.style.color = "#000000"
            info.innerHTML = `<p><span>&#9737;</span></p><p>Today</p><p>${dayhours} hours of day</p><p>${daylight}%</p><p class='small'> Lat ${lat}, Long ${long}</p>`               
        }
    }

// function getGeo(){
    
//     if ("geolocation" in navigator) {
//         navigator.geolocation.getCurrentPosition(function(position) {
//             console.log("getting")
//             lat = position.coords.latitude;
//             long = position.coords.longitude;
//             // apiUrl = "https://api.sunrisesunset.io/json?lat=" + lat + "&lng=" + long + '"'
//             apiUrl="https://api.sunrisesunset.io/json?lat=38.907192&lng=-77.036873/"
//             console.log(apiUrl);
//             fetchData(apiUrl);
//         }, function(error) {
//             console.log("getting")
//           lat = 51.383741;
//           long = -2.377120;
//           apiUrl = "https://api.sunrisesunset.io/json?lat=" + lat + "&lng=" + long + '/"'
//           fetchData(apiUrl);
//           console.error("Error: " + error.message);
//         });
//       } else {
//         console.log("getting")
//         console.log("Geolocation is not supported by this browser.");
//         lat = 51.383741;
//         long = -2.377120;
//         apiUrl = "https://api.sunrisesunset.io/json?lat=" + lat + "&lng=" + long + '/"'
//         fetchData(apiUrl);
//       }
// }

window.onload = (event) => {
    info = document.getElementById('info');
    // getGeo();
            lat = 51.383741;
          long = -2.377120;
          apiUrl = "https://api.sunrisesunset.io/json?lat=" + lat + "&lng=" + long + '/"'
          fetchData(apiUrl);
  };



