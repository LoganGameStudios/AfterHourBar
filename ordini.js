"use strict";

const picker = document.querySelector("#order-picker");
const whatsapp = document.querySelector("#order-fallback");
const cakeForm = document.querySelector("#order-torte");
const savouryForm = document.querySelector("#order-rosticceria");
const rusticiError = document.querySelector("#rustici-error");
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
const mignonQuantity = document.querySelector("#mignon-quantity");

function updatePastryOptions() {
  const isMignon = cakeFields.type.value === "Mignon";
  cakeFormat.hidden = isMignon;
  cakeDecoration.hidden = isMignon;
  cakeFields.size.disabled = isMignon;
  cakeFields.inscription.disabled = isMignon;
  mignonQuantity.hidden = !isMignon;
  cakeFields.pieces.disabled = !isMignon;
}

cakeFields.type.addEventListener("change", updatePastryOptions);
updatePastryOptions();

cakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = cakeForm.elements;
  fields.flavours.value = fields.flavours.value.trim();
  const details = [`Prodotto: ${fields.type.value}`, `Gusti: ${fields.flavours.value}`];

  if (fields.type.value === "Mignon") {
    if (fields.pieces.value) details.push(`Quantità: ${fields.pieces.value} pezzi`);
  } else {
    details.push(`Formato: ${fields.size.value}`);
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
  });

  return { quantity, increase };
});

savouryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = products
    .map(({ quantity }) => ({ name: quantity.dataset.quantity, pieces: Number(quantity.value) }))
    .filter(({ pieces }) => pieces > 0);
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

whatsapp.hidden = true;
picker.hidden = false;
