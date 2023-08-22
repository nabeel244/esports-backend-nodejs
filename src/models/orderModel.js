const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  items: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  shippingDetails: {
    name: String,
    address: {
      city: String,
      country: String,
      line1: String,
      line2: String,
      postal_code: String,
      state: String,
    },
  },

  status: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dateOrdered: {
    type: Date,
    default: Date.now,
  },
});

exports.Order = mongoose.model("Order", orderSchema);
/*
order example
{
    "userId" : "6411709ed972a6c4c85be49f",
    "products" : [
        {
            "productId" : "641171a8b02ebf9ba6b0c3e9",
            "quantity" : 3
        },
        {
            "productId" : "64117204b02ebf9ba6b0c3ec",
            "quantity" : 2
        }
    ],
    "shippingAddress" : "ssjhfgsdajfhgdsf",
    "zip" : "12345",
    "city" : "Lahore",
    "country" : "pakistan",
    "phone" : "12312312"
}
*/
