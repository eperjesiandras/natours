/* eslint-disable */
import { displayMap } from "./leaflet";
import { login, logout } from "./login";
import { signup } from "./signup";
import { updateSettings } from "./updateSettings";
//import { resizeImage } from "./resizeImage.js";
import { bookTour } from "./stripe";
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️DOM ELEMENTS*/
const map = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const formSignUp = document.getElementById("form--signup");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// VALUES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️DELEGATION*/
if (map) {
  const locations = JSON.parse(map.dataset.locations);
  /*we need JSON parse here because we stringified tour.json.locations in tour.pug*/
  displayMap(locations);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (loginForm)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (logOutBtn) logOutBtn.addEventListener("click", logout);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (formSignUp)
  formSignUp.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    signup(name, email, password, passwordConfirm);
  });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (userDataForm) {
  userDataForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--green").textContent = "Uploading...";

    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    //console.log(form);

    await updateSettings(form, "data");
    document.querySelector(".btn--green").textContent = "Save settings";
  });
}

/*axios will recognise form as an object, so we dont need to change updatesetings attribute from data to form!*/ // const name = document.getElementById("name").value;
// const email = document.getElementById("email").value;
// updateSettings({ name, email }, "data");
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (userPasswordForm)
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, "password");
    /*we await here in order to open the possibility to do another stuff with the settings before save - in this case we will clear the password forms*/
    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = " ";
    document.getElementById("password").value = " ";
    document.getElementById("password-confirm").value = " ";
  });

if (bookBtn)
  bookBtn.addEventListener("click", (e) => {
    e.target.textContent = "...Processing";
    //const tourId= e.target.dataset.tourId
    /*The dataset read-only property of the HTMLElement interface provides read/write access to custom data attributes (data-*) on elements. It exposes a map of strings (DOMStringMap) with an entry for each data-* attribute. Here the book button is the target*/
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
