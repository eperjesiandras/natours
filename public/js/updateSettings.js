/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const updateSettings = async (data, type) => {
  /*type is either password, or data*/
  try {
    const url =
      type === "password"
        ? "http://127.0.0.1:3000/api/v1/users/updatemypassword"
        : "http://127.0.0.1:3000/api/v1/users/updateme";

    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully!`);
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
