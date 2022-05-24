import axios from "axios";

export const addItemsToCart = (id, quantity) => async (dispatch) => {
  const { data } = await axios.get(`/api/v1/product/${id}`);

  dispatch({
    type: "AddToCart",
    payload: {
      product: data.product._id,
      name: data.product.name,
      price: data.product.price,
      image: data.product.images[0].url,
      stock: data.product.stock,
      quantity,
    },
  });
};

export const removeItemsFromCart = (id) => async (dispatch) => {
  dispatch({
    type: "RemoveFromCart",
    payload: id,
  });
};

export const saveShippingInfo = (data) => async (dispatch) => {
  dispatch({
    type: "SaveShippingInfo",
    payload: data,
  });
};
