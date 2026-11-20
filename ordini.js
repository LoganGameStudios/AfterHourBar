"use strict";

const picker = document.querySelector("#order-picker");
const whatsapp = document.querySelector("#order-fallback");
const cakeForm = document.querySelector("#order-torte");
const savouryForm = document.querySelector("#order-rosticceria");
const rusticiError = document.querySelector("#rustici-error");
const rusticiRecap = document.querySelector("#rustici-recap");
const rusticiRecapItems = document.querySelector("#rustici-recap-items");
const rusticiRecapTotal = document.querySelector("#rustici-recap-total");
const dayFormat = new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" });
const italianCalendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit"
});

function todayInItaly() {
  const parts = Object.fromEntries(italianCalendar.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function sendRequest(form, details) {
  const fields = form.elements;
  fields.date.min = todayInItaly();
  fields.surname.value = fields.surname.value.trim();
  if (!form.reportValidity()) return;

  const date = dayFormat.format(new Date(`${fields.date.value}T00:00:00Z`));
  const message = [
    "Buongiorno, vorrei chiedere disponibilità e prezzo per questa ordinazione.",
    ...details,
    `Cognome: ${fields.surname.value}`,
    `Giorno di ritiro: ${date}`
  ].join("\n");
  const link = new URL(whatsapp.href);
  link.searchParams.set("text", message);
  window.location.assign(link.href);
}

for (const form of [cakeForm, savouryForm]) {
  form.elements.date.min = todayInItaly();
}

const orderSwitch = picker.querySelector(".order-switch");
function showSelectedForm() {
  const showCake = orderSwitch.querySelector("input:checked").value === "pasticceria";
  cakeForm.hidden = !showCake;
  savouryForm.hidden = showCake;
}

orderSwitch.addEventListener("change", showSelectedForm);
showSelectedForm();

const cakeFields = cakeForm.elements;
const cakeFormat = document.querySelector("#cake-format");
const cakeDecoration = document.querySelector("#cake-decoration");
const cakeTopping = document.querySelector("#cake-topping-field");
const mignonWeight = document.querySelector("#mignon-weight-field");
const mignonPreferences = document.querySelector("#mignon-preferences");
const cakeFlavours = document.querySelector("#cake-flavours-field");
const mignonTypes = [...mignonPreferences.querySelectorAll('input[name="mignonType"]')];
const mignonCreams = [...mignonPreferences.querySelectorAll('input[name="mignonCream"]')];
const flavourRows = [...document.querySelectorAll("[data-mignon-kind]")];
const byType = document.querySelector("#mignon-by-type");
const mixField = document.querySelector("#mignon-mix");

function updateMignonChoices() {
  const isMix = cakeFields.mignonMode.value === "mix";
  const selectedKinds = new Set(mignonTypes.filter((item) => item.checked).map((item) => item.value));

  byType.hidden = isMix || !selectedKinds.size;
  for (const row of flavourRows) {
    row.hidden = isMix || !selectedKinds.has(row.dataset.mignonKind);
    row.querySelector("select").disabled = row.hidden;
  }

  mixField.hidden = !isMix;
  mixField.disabled = !isMix;
  const count = mignonCreams.filter((item) => item.checked).length;
  mignonCreams[0].setCustomValidity(isMix && count < 2 ? "Seleziona almeno due gusti per il mix." : "");
}

mignonPreferences.addEventListener("change", updateMignonChoices);
updateMignonChoices();

function updatePastryOptions() {
  const isMignon = cakeFields.type.value === "Mignon";
  const isClassic = cakeFields.type.value === "Torta classica";
  cakeTopping.hidden = !isClassic;
  cakeFields.topping.disabled = !isClassic;
  cakeFormat.hidden = isMignon;
  cakeDecoration.hidden = isMignon;
  cakeFields.size.disabled = isMignon;
  cakeFields.inscription.disabled = isMignon;
  mignonWeight.hidden = !isMignon;
  cakeFields.weight.disabled = !isMignon;
  mignonPreferences.hidden = !isMignon;
  mignonPreferences.disabled = !isMignon;
  cakeFlavours.hidden = isMignon;
  cakeFields.flavours.disabled = isMignon;
}

cakeFields.type.addEventListener("change", updatePastryOptions);
updatePastryOptions();

cakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = cakeForm.elements;
  const details = [`Prodotto: ${fields.type.value}`];

  if (fields.type.value === "Mignon") {
    const grams = Number(fields.weight.value);
    details.push(`Peso: ${grams} g`);
    const preferences = new FormData(cakeForm);
    const kinds = preferences.getAll("mignonType");
    const notes = fields.mignonNotes.value.trim();

    if (fields.mignonMode.value === "mix") {
      if (kinds.length) details.push(`Tipi di mignon: ${kinds.join(", ")}`);
      details.push(`Mix di gusti: ${preferences.getAll("mignonCream").join(", ")}`);
    } else {
      const flavours = flavourRows.filter((row) => !row.hidden).map((row) => {
        const flavour = row.querySelector("select").value || "a scelta del bar";
        return `- ${row.dataset.mignonKind}: ${flavour}`;
      });
      if (flavours.length) details.push("Gusti per tipo:", ...flavours);
    }
    if (notes) details.push(`Altre preferenze: ${notes}`);
  } else {
    fields.flavours.value = fields.flavours.value.trim();
    details.push(`Gusti: ${fields.flavours.value}`);
    details.push(`Formato: ${fields.size.value}`);
    if (!fields.topping.disabled && fields.topping.value) {
      details.push(`Copertura: ${fields.topping.value}`);
    }
    const inscription = fields.inscription.value.trim();
    if (inscription) details.push(`Scritta sulla torta: ${inscription}`);
  }
  sendRequest(cakeForm, details);
});

const products = [...savouryForm.querySelectorAll(".quantity-row")].map((row) => {
  const quantity = row.querySelector("[data-quantity]");
  const decrease = row.querySelector('[data-step="-1"]');
  const increase = row.querySelector('[data-step="1"]');
  const group = row.closest(".quantity-group");

  row.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-step]");
    if (!button || button.getAttribute("aria-disabled") === "true") return;

    const next = Math.max(0, Number(quantity.value) + Number(button.dataset.step));
    quantity.value = String(next);
    decrease.setAttribute("aria-disabled", String(next === 0));
    row.toggleAttribute("data-selected", next > 0);
    if (next > 0) rusticiError.hidden = true;

    if (group) {
      const total = [...group.querySelectorAll("[data-quantity]")]
        .reduce((sum, item) => sum + Number(item.value), 0);
      group.querySelector(".quantity-total").textContent = total ? `${total} ${total === 1 ? "pezzo" : "pezzi"}` : "3 varietà";
    }
    updateRusticiRecap();
  });

  return { quantity, increase };
});

function selectedRustici() {
  return products
    .map(({ quantity }) => ({ name: quantity.dataset.quantity, pieces: Number(quantity.value) }))
    .filter(({ pieces }) => pieces > 0);
}

function updateRusticiRecap() {
  const selected = selectedRustici();
  const total = selected.reduce((sum, item) => sum + item.pieces, 0);
  rusticiRecap.hidden = total === 0;
  rusticiRecapTotal.textContent = `${total} ${total === 1 ? "pezzo" : "pezzi"}`;
  rusticiRecapItems.replaceChildren(...selected.map(({ name, pieces }) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const quantity = document.createElement("strong");
    label.textContent = name;
    quantity.textContent = `× ${pieces}`;
    item.append(label, quantity);
    return item;
  }));
}

savouryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = selectedRustici();
  rusticiError.hidden = selected.length > 0;
  if (!selected.length) {
    const firstButton = products[0].increase;
    const summary = firstButton.closest("details:not([open])")?.querySelector("summary");
    (summary ?? firstButton).focus();
    return;
  }

  const details = ["Rosticceria:", ...selected.map(({ name, pieces }) => `- ${name}: ${pieces} ${pieces === 1 ? "pezzo" : "pezzi"}`)];
  const notes = savouryForm.elements.notes.value.trim();
  if (notes) details.push(`Preferenze: ${notes}`);
  sendRequest(savouryForm, details);
});

updateRusticiRecap();
whatsapp.hidden = true;
picker.hidden = false;
