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
const weightFormat = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 3 });

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
  const showCake = orderSwitch.querySelector("input:checked").value === "torte";
  cakeForm.hidden = !showCake;
  savouryForm.hidden = showCake;
}

orderSwitch.addEventListener("change", showSelectedForm);
showSelectedForm();

cakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = cakeForm.elements;
  fields.flavours.value = fields.flavours.value.trim();
  const details = [
    `Tipo: ${fields.type.value}`,
    `Gusti: ${fields.flavours.value}`,
    `Formato: ${fields.size.value}`
  ];
  if (fields.weight.value) {
    details.push(`Peso desiderato: ${weightFormat.format(fields.weight.valueAsNumber)} kg`);
  }
  sendRequest(cakeForm, details);
});

const products = [...savouryForm.querySelectorAll('input[name="rustico"]')];
for (const product of products) {
  product.addEventListener("change", () => {
    if (products.some((item) => item.checked)) rusticiError.hidden = true;
  });
}

savouryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = products.filter((item) => item.checked);
  rusticiError.hidden = Boolean(selected.length);
  if (!selected.length) {
    products[0].focus();
    return;
  }

  const details = [`Rosticceria: ${selected.map((item) => item.value).join(", ")}`];
  const notes = savouryForm.elements.notes.value.trim();
  if (notes) details.push(`Quantità o preferenze: ${notes}`);
  sendRequest(savouryForm, details);
});

whatsapp.hidden = true;
picker.hidden = false;
