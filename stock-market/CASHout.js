/** @param {NS} ns **/
export async function main(ns) {
    const symbols = ns.stock.getSymbols();
    let totalProfit = 0;

    for (const symbol of symbols) {
        const [shares, avgPrice, sharesShort, avgShortPrice] = ns.stock.getPosition(symbol);

        // Sell long position
        if (shares > 0) {
            const salePrice = ns.stock.sellStock(symbol, shares);
            const profit = (salePrice - avgPrice) * shares;
            totalProfit += profit;
            ns.tprint(`📉 Sold ${shares} shares of ${symbol} @ \$${salePrice.toFixed(2)} (Profit: \$${profit.toFixed(2)})`);
        }

        // Cover short position
        if (sharesShort > 0) {
            const coverPrice = ns.stock.sellShort(symbol, sharesShort);
            const profit = (avgShortPrice - coverPrice) * sharesShort;
            totalProfit += profit;
            ns.tprint(`📈 Covered ${sharesShort} short shares of ${symbol} @ \$${coverPrice.toFixed(2)} (Profit: \$${profit.toFixed(2)})`);
        }
    }

    ns.tprint(`✅ Total realized profit: \$${totalProfit.toFixed(2)}`);
}
