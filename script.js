const URL_API =
  "https://api.open-meteo.com/v1/forecast?latitude=43.6047&longitude=1.4442" +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code,is_day" +
  "&hourly=temperature_2m,weather_code" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
  "&timezone=Europe%2FParis&forecast_days=7";

const CODES = {
  0: ["Ciel dégagé", "☀️", "🌙"], 1: ["Plutôt dégagé", "🌤️", "🌙"],
  2: ["Partiellement nuageux", "⛅", "☁️"], 3: ["Couvert", "☁️", "☁️"],
  45: ["Brouillard", "🌫️", "🌫️"], 48: ["Brouillard givrant", "🌫️", "🌫️"],
  51: ["Bruine légère", "🌦️", "🌧️"], 53: ["Bruine", "🌦️", "🌧️"], 55: ["Bruine forte", "🌧️", "🌧️"],
  61: ["Pluie faible", "🌦️", "🌧️"], 63: ["Pluie", "🌧️", "🌧️"], 65: ["Pluie forte", "🌧️", "🌧️"],
  71: ["Neige faible", "🌨️", "🌨️"], 73: ["Neige", "❄️", "❄️"], 75: ["Neige forte", "❄️", "❄️"],
  80: ["Averses", "🌦️", "🌧️"], 81: ["Averses", "🌧️", "🌧️"], 82: ["Fortes averses", "⛈️", "⛈️"],
  95: ["Orage", "⛈️", "⛈️"], 96: ["Orage et grêle", "⛈️", "⛈️"], 99: ["Orage et grêle", "⛈️", "⛈️"]
};

const $ = (id) => document.getElementById(id);
const deg = (n) => Math.round(n) + "°";

function info(code, jour = 1) {
  const c = CODES[code] || ["Conditions inconnues", "🌡️", "🌡️"];
  return { texte: c[0], icone: jour ? c[1] : c[2] };
}

function themeFond(code, jour) {
  if (!jour) return "nuit";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return "pluie";
  if ([2, 3, 45, 48, 71, 73, 75].includes(code)) return "nuageux";
  return "clair";
}

function afficherHeure() {
  $("date-heure").textContent = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris", weekday: "long", day: "numeric",
    month: "long", hour: "2-digit", minute: "2-digit"
  });
}

function afficher(d) {
  const c = d.current;
  const jour = c.is_day === 1;
  const etat = info(c.weather_code, jour);

  document.body.className = themeFond(c.weather_code, jour);
  $("icone").textContent = etat.icone;
  $("temperature").textContent = deg(c.temperature_2m);
  $("description").textContent = etat.texte;
  $("min-max").textContent =
    "Max " + deg(d.daily.temperature_2m_max[0]) + " · Min " + deg(d.daily.temperature_2m_min[0]);
  $("ressenti").textContent = deg(c.apparent_temperature);
  $("humidite").textContent = Math.round(c.relative_humidity_2m) + " %";
  $("vent").textContent = Math.round(c.wind_speed_10m) + " km/h";
  $("pression").textContent = Math.round(c.pressure_msl) + " hPa";

  // Prochaines heures
  const debut = Math.max(0, d.hourly.time.indexOf(c.time.slice(0, 13) + ":00"));
  $("heures").innerHTML = d.hourly.time.slice(debut, debut + 24).map((t, i) => {
    const k = debut + i;
    const h = parseInt(t.slice(11, 13), 10);
    const estJour = h >= 7 && h < 21;
    return `<div class="heure"><span class="h">${i === 0 ? "Now" : h + " h"}</span>` +
      `<span class="i">${info(d.hourly.weather_code[k], estJour).icone}</span>` +
      `<span class="t">${deg(d.hourly.temperature_2m[k])}</span></div>`;
  }).join("").replace("Now", "Maint.");

  // 7 jours
  $("jours").innerHTML = d.daily.time.map((t, i) => {
    const nom = i === 0 ? "Aujourd’hui" :
      new Date(t + "T12:00").toLocaleDateString("fr-FR", { weekday: "long" });
    return `<li class="jour"><span class="nom">${nom}</span>` +
      `<span class="i">${info(d.daily.weather_code[i]).icone}</span>` +
      `<span class="t">${deg(d.daily.temperature_2m_max[i])} <span>${deg(d.daily.temperature_2m_min[i])}</span></span></li>`;
  }).join("");

  $("maj").textContent = "Dernière mise à jour : " +
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

async function charger() {
  try {
    const r = await fetch(URL_API);
    if (!r.ok) throw new Error(r.status);
    afficher(await r.json());
  } catch (e) {
    $("description").textContent = "Impossible de charger la météo. Vérifiez votre connexion.";
    $("icone").textContent = "⚠️";
  }
}

afficherHeure();
setInterval(afficherHeure, 30000);
charger();
setInterval(charger, 10 * 60 * 1000);

