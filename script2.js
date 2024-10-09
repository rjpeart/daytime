// Constants and configuration
const DEFAULT_LOCATION = { lat: 51.383741, long: -2.377120 };
const API_URL = "https://api.sunrisesunset.io/json";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const IP_GEOLOCATION_API = "https://ipapi.co/json/";

const MAJOR_CITIES = [
    { name: "New York", lat: 40.7128, long: -74.0060 },
    { name: "London", lat: 51.5074, long: -0.1278 },
    { name: "Tokyo", lat: 35.6762, long: 139.6503 },
    { name: "Paris", lat: 48.8566, long: 2.3522 },
    { name: "Sydney", lat: -33.8688, long: 151.2093 },
    { name: "Dubai", lat: 25.2048, long: 55.2708 },
    { name: "Reykjavík", lat: 64.125613, long: -21.848036 },
    { name: "Rio de Janeiro", lat: -22.9068, long: -43.1729 },
    { name: "Palestine", lat: 31.363759, long: 34.317467 },
    { name: "Cape Town", lat: -33.9249, long: 18.4241 },
    { name: "Moscow", lat: 55.7558, long: 37.6173 },
    { name: "Mumbai", lat: 19.0760, long: 72.8777 }
];

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
    mobInfoDay: null,
    loadingAnimation: null,
    citySelect: null
};

// Initialization
document.addEventListener('DOMContentLoaded', init);

async function init() {
    createCityDropdown();
    cacheElements();
    try {
        const coords = await getIPBasedLocation();
        await fetchSunData(coords);
        updateDropdownWithNearestCity(coords);
    } catch (error) {
        console.error("Error during initialization:", error);
        handleLocationError();
    }
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
    elements.citySelect = document.getElementById('city-select');
}

// Location functions
async function getIPBasedLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (!data.latitude || !data.longitude) {
            throw new Error("Invalid location data from IP geolocation");
        }
        console.log("lat= " + data.latitude + " long= " + data.longitude)
        return { lat: data.latitude, long: data.longitude };
    } catch (error) {
        console.error("Error fetching IP-based location:", error);
        throw error;
    }
}

function handleLocationError() {
    console.log("Using default location due to error");
    const defaultCity = MAJOR_CITIES[0];
    fetchSunData(defaultCity)
        .then(() => {
            elements.citySelect.value = JSON.stringify({lat: defaultCity.lat, long: defaultCity.long});
        })
        .catch(handleAPIError);
}

//API Functions
async function fetchSunData({ lat, long }) {
    elements.loadingAnimation.style.display = "flex";
    if (!lat || !long) {
        throw new Error("Invalid coordinates");
    }
    const url = `${API_URL}?lat=${lat}&lng=${long}`;
    try {
        const data = await fetchData(url);
        if (!data.results || !data.results.sunrise || !data.results.sunset) {
            throw new Error('API response is missing expected data');
        }
        updateState(data.results);
        await fetchCityData(lat, long);
        updateUI();
        elements.loadingAnimation.style.display = "none";
        elements.citySelect.style.display = "block";
        if (window.innerWidth > 768) {
            elements.info.style.display = "block";
        }
    } catch (error) {
        console.error('Error:', error);
        handleAPIError(error);
    }
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

function handleAPIError(error) {
    console.error('API Error:', error);
    elements.loadingAnimation.style.display = "none";
    elements.citySelect.style.display = "block";
    alert("Error loading data. Please try selecting a city from the dropdown.");
}

//State and UI update functions
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

function updateInfo(mouseX) {
    const { dayhours, nighthours, daylight, nighttime, city, country } = state;
    const isDaytime = mouseX > state.pixelThreshold;

    // Set text color based on background
    const backgroundColor = isDaytime ? "#ffffff" : "#000000";
    const textColor = isDaytime ? "#000000" : "#ffffff";

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

//City dropdown functions
// Create and populate the dropdown
function createCityDropdown() {
    const select = document.createElement('select');
    select.id = 'city-select';
    select.innerHTML = '<option value="">Select a location</option>';
    MAJOR_CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = JSON.stringify({lat: city.lat, long: city.long});
        option.textContent = city.name;
        select.appendChild(option);
    });
    select.addEventListener('change', handleCitySelection);
    document.body.appendChild(select);
}

// Handle city selection
function handleCitySelection(event) {
    if (event.target.value) {
        const coords = JSON.parse(event.target.value);
        fetchSunData(coords);
    }
}

function updateDropdownWithNearestCity(coords) {
    const nearest = findNearestCity(coords);
    const nearestCityValue = JSON.stringify({lat: nearest.lat, long: nearest.long});
}

function findNearestCity(coords) {
    return MAJOR_CITIES.reduce((nearest, city) => {
        const distance = getDistance(coords, city);
        return distance < nearest.distance ? {...city, distance} : nearest;
    }, {distance: Infinity});
}

//Utility Functions
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

function getDistance(coords1, coords2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.long - coords1.long) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

//Event Handlers
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