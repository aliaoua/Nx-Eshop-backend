const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/order-item");
const { Product } = require("../models/product");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51PItda02DoTn2WiKhkU6bb0Kh3IdXmf7FBzC39oHEJMKeZhfBimbjkh7tEd1ZNWfbF6bZ2Mafi6WxLTe6hOtXNO600YhqXQalf"
);

router.get(`/`, async (req, res) => {
  try {
    const orderList = await Order.find()
      .populate("user", "name")
      .sort({ dateOrdered: -1 });
    res.send(orderList);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching orders.",
    });
  }
});
router.get(`/:id`, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name")
      .populate({
        path: "orderItems",
        populate: { path: "product", populate: "category" },
      });

    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching order.",
    });
  }
});
router.post("/", async (req, res) => {
  try {
    const orderItemsIds = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );
    const totalPrices = await Promise.all(
      orderItemsIds.map(async (id) => {
        const orderItem = await OrderItem.findById(id).populate(
          "product",
          "price"
        );
        const totalPrice = orderItem.quantity * orderItem.product.price;
        return totalPrice;
      })
    );
    const totalPrice = totalPrices.reduce((acc, price) => {
      return acc + price;
    }, 0);
    const newOrder = new Order({
      orderItems: orderItemsIds,
      ShippingAddress1: req.body.ShippingAddress1,
      ShippingAddress2: req.body.ShippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: totalPrice,
      user: req.body.user,
    });

    await newOrder.save();
    res.status(201).send(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred while creating the order.",
    });
  }
});
router.post("/create-checkout-session", async (req, res) => {
  try {
    const orderItems = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res
        .status(400)
        .send("checkout-session cannot be created - check order-items");
    }

    const lineItems = await Promise.all(
      orderItems.map(async (orderItem) => {
        if (!orderItem.product || !orderItem.quantity) {
          throw new Error(`Invalid order item: ${JSON.stringify(orderItem)}`);
        }
        const product = await Product.findById(orderItem.product);
        if (!product) {
          throw new Error(`Product with id ${orderItem.product} not found`);
        }
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
            },
            unit_amount: product.price * 100,
          },
          quantity: orderItem.quantity,
        };
      })
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `http://localhost:3000/success`,
      cancel_url: `http://localhost:3000/error`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(
      "Error creating checkout session:",
      error.message,
      error.stack
    );
    res.status(500).send("Internal Server Error");
  }
});
router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    {
      new: true,
    }
  );
  if (!order) {
    res.status(404).send("the category can not be updated!");
  }
  res.send(order);
});
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Delete order items associated with the order
    await OrderItem.deleteMany({ _id: { $in: order.orderItems } });

    // Delete the order
    await Order.findByIdAndDelete(req.params.id);

    return res
      .status(200)
      .json({ success: true, message: "The order and its items are deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
router.get("/get/totalsales", async (req, res) => {
  // const orders = await Order.find();
  // const totalSales = await orders.reduce((acc, order) => {
  //   return order.totalPrice + acc;
  // }, 0);
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);
  if (!totalSales) {
    return res.status(0);
  }

  res.send({ totalsales: totalSales.pop().totalsales });
});
router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount) {
    return res.status(0);
  }

  res.send({ orderCount: orderCount });
});
router.get("/get/userOrders/:userId", async (req, res) => {
  const orders = await Order.find({ user: req.params.userId })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });

  if (!orders) {
    return res.status(0);
  }

  res.send(orders);
});
module.exports = router;
