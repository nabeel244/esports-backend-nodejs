const factory = require("./factoryController");
const { Order } = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const asyncHandler = require("../utils/asyncHandler");
const { codeGenerator } = require("../utils/codeGenerator");
const Tournament = require("../models/tournamentModel");
const { Email } = require("../utils/sendEmail");

const STRIPE_PRIVATE_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY;
const stripe = require("stripe")(STRIPE_PRIVATE_KEY);

exports.checkout = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  const checkoutData = {
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/success`,
    cancel_url: `${req.protocol}://${req.get("host")}/${product.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.productId,
    mode: "payment",
    phone_number_collection: { enabled: true },

    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: product.price * 100,
          product_data: {
            name: product.name,
            // images: product.images
          },
        },
        quantity: 1,
      },
    ],
  };

  if (product.subCategory !== "nft") {
    checkoutData.metadata = {
      tournament: product.tournamentId.toHexString(),
      tournamentName: product.tournamentName,
    };
    checkoutData.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: product.deliveryFee * 100,
            currency: "usd",
          },
          display_name: "Free Shipping",
          delivery_estimate: product.deliveryEstimate,
        },
      },
    ];

    checkoutData.shipping_address_collection = {
      allowed_countries: ["CA", "PK", "US"],
    };
    checkoutData.metadata = {};
  }

  const session = await stripe.checkout.sessions.create(checkoutData);
  res.status(200).json({
    status: "success",
    session,
  });
});

// Add data to database after checkout succeeds.
const createOrderCheckout = asyncHandler(async (session) => {
  const productId = session.client_reference_id;
  const product = await Product.findById(productId);
  const code = codeGenerator();
  let mailOptions, templateOptions;

  const user = await User.findOne({
    email: session.customer_details.email,
  });

  const obj = {
    item: [{ id: productId, quantity: 1 }],
    shippingDetails: session.shipping_details,
    phone: session.customer_details.phone,
    status: session.payment_status,
    totalPrice: session.amount_total / 100,
    userId: user.id,
  };
  await Order.create(obj);

  if (product.subCategory === "nft") {
    await Tournament.findByIdAndUpdate(
      session.metadata.tournament,
      {
        $push: {
          rsvpCodes: {
            userId: user.id,
            code,
          },
        },
      },
      { new: true }
    );
    templateOptions = { templateName: "rsvp", code };
    mailOptions = {
      from: process.env.GOOGLE_EMAIL,
      to: user.email,
      subject: "RSVP Code",
    };
  } else {
    templateOptions = { templateName: "checkout", order: product.name };
    mailOptions = {
      from: process.env.GOOGLE_EMAIL,
      to: user.email,
      subject: "Order Completion",
    };
  }

  const mail = new Email(mailOptions, templateOptions);
  await mail.send();
});

// Handle checkout.session.completed event.
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  const payload = req.body;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    createOrderCheckout(event.data.object);

  res.status(200).json({ status: "success", message: "Payment Successfull" });
};

exports.getById = factory.getById(Order);
exports.getAllOrders = factory.getAll(Order);
exports.update = factory.updateById(Order);
exports.delete = factory.deleteById(Order);
