"use strict";

const picker = document.querySelector("#order-picker");
const whatsapp = document.querySelector("#order-fallback");
const orderForm = document.querySelector("#order-form");
const orderFields = orderForm.elements;
const pastry = document.querySelector("#order-torte");
const savoury = document.querySelector("#order-rosticceria");
const savouryNotes = document.querySelector("#rustici-notes-field");
const orderRecap = document.querySelector("#order-recap");
const emptyOrderError = document.querySelector("#order-empty-error");
const pastryRecap = document.querySelector("#pastry-recap");
const pastryRecapItems = document.querySelector("#pastry-recap-items");
const addPastry = document.querySelector("#add-pastry");
const pastryStatus = document.querySelector("#pastry-status");
const pastryItems = [];
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

function sendRequest(details) {
  const fields = orderFields;
  fields.date.min = todayInItaly();
  fields.surname.value = fields.surname.value.trim();
  if (!fields.surname.reportValidity() || !fields.date.reportValidity()) return;

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

orderFields.date.min = todayInItaly();

const orderSwitch = picker.querySelector(".order-switch");

function showSelectedForm() {
  const kind = orderSwitch.querySelector("input:checked").value;
  pastry.hidden = kind === "rosticceria";
  pastry.disabled = pastry.hidden;
  savoury.hidden = kind === "pasticceria";
  savoury.disabled = savoury.hidden;
  updateOrderRecap();
}

const cakeFormat = document.querySelector("#cake-format");
const cakeDecoration = document.querySelector("#cake-decoration");
const cakeTopping = document.querySelector("#cake-topping-field");
const mignonWeight = document.querySelector("#mignon-weight-field");
const mignonPreferences = document.querySelector("#mignon-preferences");
const cakeFlavours = document.querySelector("#cake-flavours-field");
const mignonTypes = [...mignonPreferences.querySelectorAll('input[name="mignonType"]')];
const flavourRows = [...document.querySelectorAll("[data-mignon-kind]")];
const byType = document.querySelector("#mignon-by-type");

function updateMignonChoices() {
  const selectedKinds = new Set(mignonTypes.filter((item) => item.checked).map((item) => item.value));
  byType.hidden = selectedKinds.size === 0;
  for (const row of flavourRows) {
    row.hidden = !selectedKinds.has(row.dataset.mignonKind);
    row.disabled = row.hidden;
  }
}

mignonPreferences.addEventListener("change", updateMignonChoices);
updateMignonChoices();

function updatePastryOptions() {
  const isMignon = orderFields.type.value === "Mignon";
  const isClassic = orderFields.type.value === "Torta classica";
  cakeTopping.hidden = !isClassic;
  orderFields.topping.disabled = !isClassic;
  cakeFormat.hidden = isMignon;
  cakeDecoration.hidden = isMignon;
  orderFields.size.disabled = isMignon;
  orderFields.inscription.disabled = isMignon;
  mignonWeight.hidden = !isMignon;
  orderFields.weight.disabled = !isMignon;
  mignonPreferences.hidden = !isMignon;
  mignonPreferences.disabled = !isMignon;
  cakeFlavours.hidden = isMignon;
  orderFields.flavours.disabled = isMignon;
}

orderFields.type.addEventListener("change", updatePastryOptions);
updatePastryOptions();

function pastryDetails() {
  const fields = orderFields;
  const details = [];

  if (fields.type.value === "Mignon") {
    const grams = Number(fields.weight.value);
    details.push(`Peso: ${grams} g`);
    const flavours = flavourRows.filter((row) => !row.hidden).map((row) => {
      const selected = [...row.querySelectorAll("input:checked")].map((item) => item.value);
      return `- ${row.dataset.mignonKind}: ${selected.join(", ") || "a scelta del bar"}`;
    });
    const notes = fields.mignonNotes.value.trim();
    if (flavours.length) details.push("Gusti per tipo:", ...flavours);
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
  return { name: fields.type.value, details };
}

addPastry.addEventListener("click", () => {
  const fields = [...pastry.querySelectorAll("input, select")];
  orderFields.flavours.value = orderFields.flavours.value.trim();
  if (!fields.every((field) => field.reportValidity())) return;

  const entry = pastryDetails();
  pastryItems.push(entry);
  pastryStatus.textContent = `${entry.name} aggiunto al riepilogo.`;

  for (const field of fields) {
    if (field.type === "checkbox") field.checked = false;
    else field.value = "";
  }
  updatePastryOptions();
  updateMignonChoices();
  updateOrderRecap();
});

pastry.addEventListener("change", () => { pastryStatus.textContent = ""; });
pastry.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches('input[type="text"]')) {
    event.preventDefault();
    addPastry.click();
  }
});

const products = [...savoury.querySelectorAll(".quantity-row")].map((row) => {
  const product = {
    row,
    quantity: row.querySelector("[data-quantity]"),
    decrease: row.querySelector('[data-step="-1"]'),
    increase: row.querySelector('[data-step="1"]'),
    group: row.closest(".quantity-group")
  };

  row.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-step]");
    if (!button || button.getAttribute("aria-disabled") === "true") return;

    const next = Math.max(0, Number(product.quantity.value) + Number(button.dataset.step));
    setProductQuantity(product, next);
  });

  return product;
});

function setProductQuantity({ row, quantity, decrease, group }, next) {
  quantity.value = String(next);
  decrease.setAttribute("aria-disabled", String(next === 0));
  row.toggleAttribute("data-selected", next > 0);

  if (group) {
    const quantities = [...group.querySelectorAll("[data-quantity]")];
    const total = quantities.reduce((sum, item) => sum + Number(item.value), 0);
    group.querySelector(".quantity-total").textContent = total ? `${total} ${total === 1 ? "pezzo" : "pezzi"}` : `${quantities.length} varietà`;
  }
  updateOrderRecap();
}

function focusProduct({ increase }) {
  if (savoury.hidden) {
    focusOrderChoice();
    return;
  }
  const summary = increase.closest("details:not([open])")?.querySelector("summary");
  (summary ?? increase).focus();
}

function focusOrderChoice() {
  orderSwitch.querySelector("input:checked").focus();
}

function selectedRustici() {
  return products
    .map((product) => ({
      product,
      name: product.quantity.dataset.quantity,
      pieces: Number(product.quantity.value)
    }))
    .filter(({ pieces }) => pieces > 0);
}

function renderRecapItems(list, entries) {
  list.replaceChildren(...entries.map(({ name, detail, pieces, removeItem, restoreFocus }, index) => {
    const item = document.createElement("li");
    const label = document.createElement("div");
    label.className = "recap-product";
    if (detail) {
      const title = document.createElement("strong");
      const description = document.createElement("small");
      title.textContent = name;
      description.textContent = detail;
      label.append(title, description);
    } else {
      label.textContent = name;
    }

    const actions = document.createElement("div");
    actions.className = "recap-actions";
    if (pieces) {
      const quantity = document.createElement("strong");
      quantity.textContent = `× ${pieces}`;
      actions.append(quantity);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "recap-remove";
    remove.textContent = "Rimuovi";
    remove.setAttribute("aria-label", `Rimuovi ${name} dal riepilogo`);
    remove.addEventListener("click", () => {
      removeItem();
      const buttons = list.querySelectorAll(".recap-remove");
      const nextButton = buttons[index] ?? buttons[index - 1];
      if (nextButton) nextButton.focus();
      else restoreFocus();
    });
    actions.append(remove);
    item.append(label, actions);
    return item;
  }));
}

function updateOrderRecap() {
  const selected = selectedRustici();
  const total = selected.reduce((sum, item) => sum + item.pieces, 0);
  const hasPastry = pastryItems.length > 0;
  const hasSavoury = total > 0;
  orderRecap.hidden = !hasPastry && !hasSavoury;
  if (!orderRecap.hidden) emptyOrderError.hidden = true;
  pastryRecap.hidden = !hasPastry;
  rusticiRecap.hidden = !hasSavoury;
  savouryNotes.hidden = savoury.hidden && !hasSavoury;
  orderFields.notes.disabled = savouryNotes.hidden;
  rusticiRecapTotal.textContent = `${total} ${total === 1 ? "pezzo" : "pezzi"}`;

  renderRecapItems(pastryRecapItems, pastryItems.map(({ name, details }, index) => ({
    name,
    detail: details.map((line) => line.replace(/^- /, "")).join(" · "),
    removeItem() {
      pastryItems.splice(index, 1);
      updateOrderRecap();
    },
    restoreFocus() {
      if (pastry.hidden) focusOrderChoice();
      else orderFields.type.focus();
    }
  })));
  renderRecapItems(rusticiRecapItems, selected.map(({ product, name, pieces }) => ({
    name,
    pieces,
    removeItem() { setProductQuantity(product, 0); },
    restoreFocus() { focusProduct(product); }
  })));
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = selectedRustici();
  if (!pastryItems.length && !selected.length) {
    emptyOrderError.hidden = false;
    focusOrderChoice();
    return;
  }

  const details = [];
  if (pastryItems.length) {
    details.push("Pasticceria:");
    for (const { name, details: options } of pastryItems) {
      details.push(`Prodotto: ${name}`, ...options, "");
    }
  }
  if (selected.length) {
    details.push("Rosticceria:", ...selected.map(({ name, pieces }) => `- ${name}: ${pieces} ${pieces === 1 ? "pezzo" : "pezzi"}`));
    const notes = orderFields.notes.value.trim();
    if (notes) details.push(`Preferenze: ${notes}`);
  }

  sendRequest(details);
});

orderSwitch.addEventListener("change", showSelectedForm);
showSelectedForm();
whatsapp.hidden = true;
picker.hidden = false;
