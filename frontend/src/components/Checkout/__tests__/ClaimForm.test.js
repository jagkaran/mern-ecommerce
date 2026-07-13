import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { userReducer } from "../../../reducers/User";
import ClaimForm from "../ClaimForm";

jest.mock("axios");

const renderWith = (ui) =>
  render(
    <Provider store={configureStore({ reducer: { user: userReducer } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );

it("submits claimToken + password and shows success", async () => {
  axios.post.mockResolvedValueOnce({ status: 201, data: { success: true } });
  renderWith(<ClaimForm claimToken={"a".repeat(64)} />);
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "passw0rd!" },
  });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/order\/claim/),
      expect.objectContaining({
        claimToken: "a".repeat(64),
        password: "passw0rd!",
      }),
      expect.anything()
    )
  );
});

it("rejects passwords shorter than 8", () => {
  renderWith(<ClaimForm claimToken={"a".repeat(64)} />);
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "short" },
  });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
});