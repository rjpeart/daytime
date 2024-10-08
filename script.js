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
var city;
var country;

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
            if (!data.results || !data.results.sunrise || !data.results.sunset) {
                throw new Error('API response is missing expected data');
            }
            sunrise = convertTimeFormat(data.results.sunrise);
            console.log('Converted sunrise:', sunrise);
            sunset = convertTimeFormat(data.results.sunset);
            console.log('Converted sunset:', sunset);
            dayhours = calculateTimeDifference(sunrise, sunset);
            console.log('Calculated dayhours:', dayhours);
            nighthours = calculateTimeDifference(sunset, sunrise);
            console.log('Calculated nighthours:', nighthours);
            daylight = timeToPercentage(dayhours)
            console.log('Calculated daylight percentage:', daylight);
            nighttime = 100-daylight;
            console.log('Calculated nighttime:', nighttime);
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
            // Handle the error appropriately (e.g., display an error message to the user)
        });
}

function convertTimeFormat(timeString) {
    // Check if the timeString is in the expected format
    if (!/^\d{1,2}:\d{2}:\d{2}\s[AP]M$/.test(timeString)) {
        console.error('Invalid time format:', timeString);
        return "00:00";
    }

    // Split the time string into components
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':');

    // Convert to 24-hour format
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    // Format the hours and minutes
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
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

function adjustWidth(dayPercentage, nightPercentage) {
    const dayDiv = document.getElementById('day');
    const nightDiv = document.getElementById('night');

    if (window.innerWidth <= 768) {
        dayDiv.style.height = dayPercentage + "svh";
        nightDiv.style.height = nightPercentage + "svh";
        dayDiv.style.width = "100%";
        nightDiv.style.width = "100%";
    } else {
        dayDiv.style.width = dayPercentage + "svw";
        nightDiv.style.width = nightPercentage + "svw";
        dayDiv.style.height = "100%";
        nightDiv.style.height = "100%";
    }
}

function calculatePixelThreshold() {
    if (window.innerWidth <= 768) {
        windowHeight = window.innerHeight;
        var daylightMultiplier = daylight * 0.01;
        pixelThreshold = windowHeight * daylightMultiplier;
    } else {
        windowWidth = window.innerWidth;
        var daylightMultiplier = daylight * 0.01;
        pixelThreshold = windowWidth * daylightMultiplier;
    }
    console.log(pixelThreshold);
}

function moveInfo(e) {
    if (window.innerWidth <= 768) {
        const mobInfoElements = document.getElementsByClassName('mob_info');
        console.log("butthole"+mobInfoElements)
        for (var i=0; i< mobInfoElements.length; i++) {
            mobInfoElements[i].style.display = "block";
        }
        // Don't move the info div on mobile
        return;    
    }
    const mobInfoElements = document.getElementsByClassName('mob_info');
    const length = mobInfoElements.length;
    for (let i = 0; i < length; i++) {
        mobInfoElements[i].style.display = "none";
    }
    x = e.pageX;
    y = e.pageY;
    TweenLite.to(info, 0.3, {
        css: {
            left: x,
            top: y
        }
    });
    updateInfo();
}

function updateInfo(){
    if (window.innerWidth <= 768) {

    }

    if(x<pixelThreshold){
        info.style.color = "#ffffff"
        info.innerHTML = `<p><span>&#9789;</span></p><p>Today</p><p>${nighthours} hours of night</p><p>${nighttime}%</p><p class='small'> Location: ${city}, ${country}</p>`               
    } else {
            info.style.color = "#000000"
            info.innerHTML = `<p><span>&#9737;</span></p><p>Today</p><p>${dayhours} hours of day</p><p>${daylight}%</p><p class='small'> Location: ${city}, ${country}</p>`               
        }
    }

function getGeo(){
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            lat = latitude;
            long = longitude;
            getCityFromCoordinates();
            apiUrl = "https://api.sunrisesunset.io/json?lat=" + lat + "&lng=" + long + '/"'
            fetchData(apiUrl);

          },
          function(error) {
            console.error("Error: " + error.message);
            lat = 51.383741;
            long = -2.377120;
            getCityFromCoordinates();
            apiUrl = "https://api.sunrisesunset.io/json?lat=" + lat + "&lng=" + long + '/"'
            fetchData(apiUrl);
          }
        );
      } else {
        console.log("Geolocation is not supported by this browser.");
      }
}

// Function to perform reverse geocoding
function getCityFromCoordinates(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        city = data.address.city || data.address.town || data.address.village || "City not found";
        country = data.address.country || "Country not found";
        console.log(`City: ${city}, ${country}`); 
      })
      .catch(error => {
        console.error("Error fetching city:", error);
      });
  }

window.onload = (event) => {
    info = document.getElementById('info');
    getGeo();
  };

  window.addEventListener('resize', () => {
    adjustWidth(daylight, nighttime);
    calculatePixelThreshold();
});


