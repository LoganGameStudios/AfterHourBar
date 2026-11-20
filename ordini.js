"use strict";

const orderForm = document.querySelector("#order-form");
const fallbackLink = document.querySelector("#order-fallback");
const pickupDate = document.querySelector("#order-date");
const dateFormat = new Intl.DateTimeFormat("it-IT", { dateStyle: "long" });

function localDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

pickupDate.min = localDate(new Date());

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  pickupDate.min = localDate(new Date());
  if (!orderForm.reportValidity()) return;

  const product = document.querySelector("#order-product").value;
  const date = dateFormat.format(new Date(`${pickupDate.value}T12:00:00`));
  const people = document.querySelector("#order-people").value;
  const quantity = people ? ` per ${people} ${people === "1" ? "persona" : "persone"}` : "";
  const message = `Buongiorno, vorrei informazioni per ordinare ${product}${quantity}, con ritiro il ${date}. Potete indicarmi disponibilità e prezzo? Grazie.`;
  const url = new URL(fallbackLink.href);
  url.searchParams.set("text", message);
  window.location.assign(url.href);
});

fallbackLink.hidden = true;
orderForm.hidden = false;
