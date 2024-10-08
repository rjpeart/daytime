// Constants and configuration
const DEFAULT_LOCATION = { lat: 51.383741, long: -2.377120 };
const API_URL = "https://api.sunrisesunset.io/json";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

// State variables
let state = {
    sunrise: '',
    sunset: '',
    daylight: 0,
    nighttime: 0,
    dayhours: '',
    nighthours: '',
    city: '',
    country: '',
    pixelThreshold: 0
};

// DOM elements
const elements = {
    info: null,
    loading: null,
    night: null,
    day: null,
    mobInfoNight: null,
    mobInfoDay: null
};

// Initialization
document.addEventListener('DOMContentLoaded', init);

function init() {
    cacheElements();
    // getGeolocation();
    fetchSunData(DEFAULT_LOCATION);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
}

function cacheElements() {
    elements.info = document.getElementById('info');
    elements.loading = document.getElementById('loading');
    elements.night = document.getElementById('night');
    elements.day = document.getElementById('day');
    elements.mobInfoNight = document.getElementById('mobInfo_night');
    elements.mobInfoDay = document.getElementById('mobInfo_day');
    elements.loadingAnimation = document.getElementById('loading-animation');

}

// Geolocation and API calls
// function getGeolocation() {
//     if ("geolocation" in navigator) {
//         navigator.geolocation.getCurrentPosition(
//             position => fetchSunData(position.coords),
//             error => {
//                 console.error("Geolocation error:", error.message);
//                 fetchSunData(DEFAULT_LOCATION);
//             }
//         );
//     } else {
//         console.log("Geolocation not supported");
//         fetchSunData(DEFAULT_LOCATION);
//     }
// }
// function getGeolocation() {
//     if ("geolocation" in navigator) {
//         navigator.geolocation.getCurrentPosition(
//             position => fetchSunData(position.coords),
//             error => {
//                 console.warn("Geolocation error:", error.message);
//                 handleGeolocationError();
//             },
//             { 
//                 timeout: 10000,  // Set a timeout of 10 seconds
//                 maximumAge: 0,   // Force fresh location
//                 enableHighAccuracy: true  // Request best possible location
//             }
//         );
//     } else {
//         console.log("Geolocation not supported");
//         handleGeolocationError();
//     }
// }

// function handleGeolocationError() {
//     // Display a message to the user
//     const message = "Unable to retrieve your location. Using default location.";
//     alert(message);  // You might want to use a more user-friendly notification method

//     // Use the default location
//     fetchSunData(DEFAULT_LOCATION);
// }

function fetchSunData({ lat, long }) {
    const url = `${API_URL}?lat=${lat}&lng=${long}`;
    fetchData(url)
        .then(data => {
            if (!data.results || !data.results.sunrise || !data.results.sunset) {
                throw new Error('API response is missing expected data');
            }
            updateState(data.results);
            return fetchCityData(lat, long);
        })
        .then(() => {
            updateUI();
            elements.loadingAnimation.style.display = "none";
            if(window.innerWidth > 768){
                elements.info.style.display = "block";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            elements.loadingAnimation.querySelector('.loading-text').textContent = "Error loading data. Please try again.";
        });
}

function fetchCityData(lat, long) {
    const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${long}`;
    return fetchData(url)
        .then(data => {
            state.city = data.address.city || data.address.town || data.address.village || "City not found";
            state.country = data.address.country || "Country not found";
        });
}

function fetchData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        });
}

// State and UI updates
function updateState(results) {
    state.sunrise = convertTimeFormat(results.sunrise);
    state.sunset = convertTimeFormat(results.sunset);
    state.dayhours = calculateTimeDifference(state.sunrise, state.sunset);
    state.nighthours = calculateTimeDifference(state.sunset, state.sunrise);
    state.daylight = timeToPercentage(state.dayhours);
    state.nighttime = 100 - state.daylight;
    calculatePixelThreshold();
}

function updateUI() {
    adjustWidth();
    if (window.innerWidth <= 768) {
        updateMobileInfo();
        elements.mobInfoNight.style.display = "block";
        elements.mobInfoDay.style.display = "block";
        elements.info.style.display = "none";
    } else {
        updateInfo();
        elements.info.style.display = "block";
        elements.mobInfoNight.style.display = "none";
        elements.mobInfoDay.style.display = "none";
    }
}

// Utility functions
function convertTimeFormat(timeString) {
    if (!/^\d{1,2}:\d{2}:\d{2}\s[AP]M$/.test(timeString)) {
        console.error('Invalid time format:', timeString);
        return "00:00";
    }
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function calculateTimeDifference(startTime, endTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;
    if (endTotalMinutes < startTotalMinutes) endTotalMinutes += 24 * 60;
    let differenceMinutes = endTotalMinutes - startTotalMinutes;
    const hours = Math.floor(differenceMinutes / 60);
    const minutes = differenceMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function timeToPercentage(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return Math.round((totalMinutes / 1440) * 10000) / 100;
}

function calculatePixelThreshold() {
    const dimension = window.innerWidth <= 768 ? window.innerHeight : window.innerWidth;
    state.pixelThreshold = dimension * (state.nighttime / 100); // Changed from daylight to nighttime
}

// Event handlers
function handleResize() {
    adjustWidth();
    calculatePixelThreshold();
    updateUI(); // This will handle showing/hiding the correct info based on screen size
}

function handleMouseMove(e) {
    if (window.innerWidth <= 768) {
        // Do nothing for mobile view
    } else {
        moveInfoElement(e.pageX, e.pageY);
        updateInfo(e.pageX);
    }
}

// UI manipulation
function adjustWidth() {
    const { daylight, nighttime } = state;
    if (window.innerWidth <= 768) {
        elements.day.style.height = `${daylight}svh`;
        elements.night.style.height = `${nighttime}svh`;
        elements.day.style.width = elements.night.style.width = "100%";
    } else {
        elements.day.style.width = `${daylight}svw`;
        elements.night.style.width = `${nighttime}svw`;
        elements.day.style.height = elements.night.style.height = "100%";
    }
}


function moveInfoElement(x, y) {
    const infoWidth = elements.info.offsetWidth;
    const infoHeight = elements.info.offsetHeight;
    const maxX = window.innerWidth - infoWidth;
    const maxY = window.innerHeight - infoHeight;

    // Ensure the info element stays within the viewport
    const adjustedX = Math.min(Math.max(0, x), maxX);
    const adjustedY = Math.min(Math.max(0, y), maxY);

    TweenLite.to(elements.info, 0.3, { css: { left: adjustedX, top: adjustedY } });
}

function updateInfo(mouseX) {
    const { dayhours, nighthours, daylight, nighttime, city, country } = state;
    const isDaytime = mouseX < state.pixelThreshold;

    // Set text color based on background
    const backgroundColor = isDaytime ? "#ffffff" : "#000000";
    const textColor = isDaytime ? "#ffffff" : "#000000";

    elements.info.style.color = textColor;

    elements.info.innerHTML = `
        <p><span>${isDaytime ? '☀' : '☾'}</span></p>
        <p>Today</p>
        <p>${isDaytime ? dayhours : nighthours} hours of ${isDaytime ? 'day' : 'night'}</p>
        <p>${isDaytime ? daylight : nighttime}%</p>
        <p class='small'>Location: ${city}, ${country}</p>
    `;
}

function updateMobileInfo() {
    const { dayhours, nighthours, daylight, nighttime, city, country } = state;
    
    elements.mobInfoDay.innerHTML = `
        <p><span>☀</span></p>
        <p>Today</p>
        <p>${dayhours} hours of day</p>
        <p>${daylight}%</p>
        <p class='small'>Location: ${city}, ${country}</p>
    `;

    elements.mobInfoNight.innerHTML = `
        <p><span>☾</span></p>
        <p>Today</p>
        <p>${nighthours} hours of night</p>
        <p>${nighttime}%</p>
        <p class='small'>Location: ${city}, ${country}</p>
    `;
}