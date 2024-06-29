import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Ensure .env variables are loaded

const app = express();
const PORT = process.env.PORT || 2000;
const URL = process.env.MONGODB_URL || "mongodb://localhost:2000/stock_tracker";

mongoose.connect(URL)
    .then(() => console.log("CONNECTED TO MONGODB ACCOUNT"))
    .catch((err) => console.error("Mongodb connection has failed likely due to", err));

const Portfolio = mongoose.model("Portfolio", {
    name: String,
    stocks: [
        {
            symbol: String,
            quantity: Number,
            purchasePrice: Number,
            currentPrice: Number,
        },
    ],
});

// Use body-parser with destructuring for ES module compatibility
const { json } = bodyParser;
app.use(json());

app.use(cors());

app.post("/api/portfolios", async (req, res) => {
    try {
        const { name, stocks } = req.body;
        const portfolio = new Portfolio({ name, stocks });
        await portfolio.save();
        res.json(portfolio);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/portfolios", async (req, res) => {
    try {
        const portfolios = await Portfolio.find();
        res.json(portfolios);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/portfolios/:id", async (req, res) => {
    try {
        const portfolio = await Portfolio.findById(req.params.id);
        if (!portfolio) throw new Error("Portfolio not found");
        res.json(portfolio);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.put("/api/portfolios/:portfolioId/stocks/:stockId", async (req, res) => {
    try {
        const { portfolioId, stockId } = req.params;
        const { name, symbol, quantity, purchasePrice, currentPrice } = req.body;

        const portfolio = await Portfolio.findById(portfolioId);

        const stockIndex = portfolio.stocks.findIndex(
            (stock) => stock._id.toString() === stockId
        );

        if (stockIndex === -1) {
            return res
                .status(404)
                .json({ message: "Stock not found in the portfolio" });
        }

        portfolio.stocks[stockIndex].name = name;
        portfolio.stocks[stockIndex].symbol = symbol;
        portfolio.stocks[stockIndex].quantity = quantity;
        portfolio.stocks[stockIndex].purchasePrice = purchasePrice;
        portfolio.stocks[stockIndex].currentPrice = currentPrice;

        await portfolio.save();

        res.status(200).json(portfolio.stocks[stockIndex]);
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.delete("/api/portfolios/:portfolioId/stocks/:stockId", async (req, res) => {
    try {
        const { portfolioId, stockId } = req.params;

        const portfolio = await Portfolio.findById(portfolioId);

        portfolio.stocks = portfolio.stocks.filter(
            (stock) => stock._id.toString() !== stockId
        );
        await portfolio.save();
        res.status(200).json({ message: "Stock deleted successfully" });
    }
    catch (error) {
        console.log("Error deleting the stock:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.put("/api/portfolios/:id", async (req, res) => {
    try {
        const { name, stocks } = req.body;
        const portfolio = await Portfolio.findByIdAndUpdate(
            req.params.id,
            { name, stocks },
            { new: true }
        );
        if (!portfolio) throw new Error("Portfolio not found");
        res.json(portfolio);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.delete("/api/portfolios/:id", async (req, res) => {
    try {
        const portfolio = await Portfolio.findByIdAndDelete(req.params.id);
        if (!portfolio) throw new Error("Portfolio not found");
        res.json({ message: "Portfolio deleted successfully" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
