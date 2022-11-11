/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    "pk_test_51M0tDyGDbpf0yVaRzV66YaAYzPz3IHNSoVRNAsUzroTGBhddk2Q4q2rq7wPnr2XVgxmqJuXCrHiHH8JyByIWnToC006uTGDrMP"
  );
  try {
    /*🗃️ Get checkout session from API*/
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    /*🗃️ Create checkout form + chanre credit card*/
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
    //window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
