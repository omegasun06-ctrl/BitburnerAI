function purchaseOrder(a, b) {
  return Math.ceil(a.timeToCoverTheSpread()) - Math.ceil(b.timeToCoverTheSpread()) ||
         b.absReturn() - a.absReturn();
}


function format_compact_currency(value) {
    
    if (value >= 1e15) {
    return `$${(value / 1e15).toFixed(3)}q`;
   }
   else if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(3)}t`;
   }
    else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(3)}b`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(3)}m`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(3)}k`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}


// Requires access to the TIX API. Purchases access to the 4S Mkt Data API as soon as it can
import {
  formatMoney,
  formatPercentage,
  formatTime,
  printBoth,
  symbolToServer
} from '/utils.js';

// Chunk 1: Configuration & Initialization
let disableShorts = false;
let commission = 100000; // Buy/sell commission. Expected profit must exceed this to buy anything.
let totalProfit = 0;
let mock = false; // If true, will "mock" buy/sell but not actually buy/sell anything

// Pre-4S configuration
let minTickHistory;
let longTermForecastWindowLength;
let nearTermForecastWindowLength;

// Hard-coded constants
const marketCycleLength = 75;
const maxTickHistory = 151;
const inversionDetectionTolerance = 0.1;
const inversionLagTolerance = 5;

let marketCycleDetected = false;
let detectedCycleTick = 0;
let inversionAgreementThreshold = 6;

const expectedTickTime = 6000;
const catchUpTickTime = 4000;
let lastTick = 0;
let sleepInterval = 1000;

//const portNumber = getPortNumbers().stock;
let stockSymbols;

// Argument schema
const argsSchema = [
  ['liquidate', false],
  ['mock', false],
  ['disable-shorts', false],
  ['reserve', 0],
  ['fracB', 0.1],
  ['fracH', 0.5],
  ['buy-threshold', 0.0001],
  ['sell-threshold', 0],
  ['diversification', 0.5],
  ['disableHud', false],
  ['pre-4s-buy-threshold-probability', 0.15],
  ['pre-4s-buy-threshold-return', 0.0015],
  ['pre-4s-sell-threshold-return', 0.0005],
  ['pre-4s-min-tick-history', 21],
  ['pre-4s-forecast-window', 51],
  ['pre-4s-inversion-detection-window', 10],
  ['pre-4s-min-blackout-window', 10],
  ['pre-4s-minimum-hold-time', 10]
];

export function autocomplete(data) {
  data.flags(argsSchema);
  return [];
}

//Chunk 2: Main Function & Trading Loop
/**
 * @param {import(".").NS } ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
  ns.disableLog('ALL');

  const options = ns.flags(argsSchema);
  mock = options.mock;
  const fracB = options.fracB;
  const fracH = options.fracH;
  stockSymbols = ns.stock.getSymbols();
  const diversification = options.diversification;
  const disableHud = options.disableHud || options.liquidate || options.mock;
  disableShorts = options['disable-shorts'];

  const pre4sBuyThresholdProbability = options['pre-4s-buy-threshold-probability'];
  const pre4sMinBlackoutWindow = options['pre-4s-min-blackout-window'] || 1;
  const pre4sMinHoldTime = options['pre-4s-minimum-hold-time'] || 0;
  const pre4s = !ns.stock.has4SDataTIXAPI();
  minTickHistory = options['pre-4s-min-tick-history'] || 21;
  nearTermForecastWindowLength = options['pre-4s-inversion-detection-window'] || 10;
  longTermForecastWindowLength = options['pre-4s-forecast-window'] || (marketCycleLength + 1);

  lastTick = 0;
  totalProfit = 0;
  marketCycleDetected = false;
  detectedCycleTick = 0;
  inversionAgreementThreshold = 6;

  let corpus = 0;
  let myStocks = [];
  let allStocks = [];

  if (!ns.stock.hasTIXAPIAccess()) {
    return printBoth(ns, `ERROR: You have to buy WSE account and TIX API access before you can run this script`);
  }

  if (options.liquidate) {
    ns.ps().filter(p => p.filename === ns.getScriptName() &&
      !p.args.includes('--l') &&
      !p.args.includes('--liquidate')).forEach(p => ns.kill(p.pid));
  }

  if (!disableShorts && ns.getPlayer().bitNodeN !== 8 &&
    !ns.singularity.getOwnedSourceFiles().some(s => s.n === 8 && s.lvl > 1)) {
    ns.print(`INFO: Shorting stocks has been disabled (you have not yet unlocked access to shorting)`);
    disableShorts = true;
  }

  allStocks = initAllStocks(ns);

  if (options.liquidate) {
    liquidate(ns);
    return;
  }

  const bitnodeMults = ns.getPlayer().bitNodeN === 5 ||
    ns.singularity.getOwnedSourceFiles().includes(s => s.n === 5)
    ? ns.getBitNodeMultipliers()
    : { FourSigmaMarketDataCost: 1, FourSigmaMarketDataApiCost: 1 };

  let hudElement = null;
  if (!disableHud) {
    hudElement = initializeHud(ns);
    ns.atExit(() => hudElement?.parentElement?.parentElement?.parentElement?.removeChild(hudElement.parentElement.parentElement));
  }

  // Main loop
  while (true) {
    const playerStats = ns.getPlayer();
    const pre4s = !ns.stock.has4SDataTIXAPI();
    corpus = await refresh(ns, playerStats, allStocks, myStocks, pre4s);

    if (pre4s && !mock && tryGet4SApi(ns, playerStats, bitnodeMults, corpus)) continue;

    const thresholdToBuy = pre4s ? options['pre-4s-buy-threshold-return'] : options['buy-threshold'];
    const thresholdToSell = pre4s ? options['pre-4s-sell-threshold-return'] : options['sell-threshold'];

    if (myStocks.length > 0) doStatusUpdate(ns, allStocks, myStocks, hudElement);
    else if (hudElement) hudElement.innerText = '$0.000 ';

    if (pre4s && allStocks[0].priceHistory.length < minTickHistory) {
      ns.print(`Building a history of stock prices (${allStocks[0].priceHistory.length}/${minTickHistory})...`);
      await ns.sleep(sleepInterval);
      continue;
    }

    // Sell logic
    let sales = 0;
    for (let stk of myStocks) {
      if (stk.absReturn() <= thresholdToSell ||
        (stk.bullish() && stk.sharesShort > 0) ||
        (stk.bearish() && stk.sharesLong > 0)) {
        if (pre4s && stk.ticksHeld < pre4sMinHoldTime) {
          if (!stk.warnedBadPurchase)
            ns.print(`WARNING: Thinking of selling ${stk.sym} with ER ${stk.absReturn()}, but holding out as it was purchased just ${stk.ticksHeld} ticks ago...`);
          stk.warnedBadPurchase = true;
        } else {
          sales += doSellAll(ns, stk);
          stk.warnedBadPurchase = false;
        }
      }
    }

    if (sales > 0) continue;

    let cash = playerStats.money - options['reserve'];
    let liquidity = cash / corpus;
    //buy logic

    if (liquidity > fracB) {
      const estTick = Math.max(
        detectedCycleTick,
        marketCycleLength - (
          !marketCycleDetected ? 5 :
            inversionAgreementThreshold <= 8 ? 15 :
              inversionAgreementThreshold <= 10 ? 30 :
                marketCycleLength
        )
      );

      /**
       * Sort stocks by how quickly they can recover the spread (time to profit),
       * then by highest expected return.
       */
      

      const sortedStocks = allStocks.sort(purchaseOrder);

      for (const stk of sortedStocks) {
        // Skip if too close to market cycle
        if (stk.blackoutWindow() >= marketCycleLength - estTick) continue;
        if (pre4s && (Math.max(pre4sMinHoldTime, pre4sMinBlackoutWindow) >= marketCycleLength - estTick)) continue;

        let budget = cash - (fracH * corpus);
        if (budget <= 0) break;

        // Skip if already maxed out or not worth buying
        if (stk.ownedShares() === stk.maxShares || stk.absReturn() <= thresholdToBuy || (disableShorts && stk.bearish())) continue;

        // Pre-4S filters
        if (pre4s && (stk.lastInversion < minTickHistory || Math.abs(stk.prob - 0.5) < pre4sBuyThresholdProbability)) continue;

        // Diversification limit
        budget = Math.min(budget, (1 - fracH) * corpus * diversification - stk.positionValue());
        if (budget <= 0 || isNaN(budget)) {
          ns.print(`ERROR: Invalid budget for ${stk.sym}`);
          continue;
        }

        let purchasePrice = stk.bullish() ? stk.ask_price : stk.bid_price;
        if (!purchasePrice || isNaN(purchasePrice)) {
          ns.print(`ERROR: Invalid purchase price for ${stk.sym}`);
          continue;
        }

        let affordableShares = Math.floor((budget - commission) / purchasePrice);
        if (isNaN(affordableShares) || affordableShares <= 0) {
          ns.print(`ERROR: Cannot afford any shares of ${stk.sym}`);
          continue;
        }

        let numShares = Math.min(stk.maxShares - stk.ownedShares(), affordableShares);
        if (isNaN(numShares) || numShares <= 0) {
          ns.print(`ERROR: Invalid share count (${numShares}) for ${stk.sym}`);
          continue;
        }

        let ticksBeforeCycleEnd = marketCycleLength - estTick - stk.timeToCoverTheSpread();
        if (ticksBeforeCycleEnd < 1) continue;

        let estEndOfCycleValue = numShares * purchasePrice * ((stk.absReturn() + 1) ** ticksBeforeCycleEnd - 1);
        if (estEndOfCycleValue <= 2 * commission) {
          ns.print(`Despite attractive ER of ${formatMoney(stk.absReturn())}, ${stk.sym} was not bought. Budget: ${formatMoney(budget)} can only buy ${numShares} shares @ ${formatMoney(purchasePrice)}. ` +
            `Given an estimated ${marketCycleLength - estTick} ticks left in market cycle, less ${stk.timeToCoverTheSpread().toFixed(1)} ticks to cover the spread (${formatPercentage(stk.spread_pct)}), ` +
            `remaining ${format_compact_currency(ticksBeforeCycleEnd)} ticks would only generate ${formatMoney(estEndOfCycleValue)}, which is less than 2x commission (${formatMoney(2 * commission)})`);
        } else {
          cash -= await doBuy(ns, stk, numShares);
        }
      }
    }


    await ns.sleep(sleepInterval);
  }
}
// Chunk 3: Stock Initialization & Utilities
function getStockInfoDict(ns, func) {
  return Object.fromEntries(stockSymbols.map(sym => [sym, func(sym)]));
}

function initAllStocks(ns) {
  const dictMaxShares = getStockInfoDict(ns, ns.stock.getMaxShares);
  return stockSymbols.map(s => ({
    sym: s,
    maxShares: dictMaxShares[s],
    expectedReturn: function () {
      let normalizedProb = (this.prob - 0.5);

      let stdDev = this.probStdDev ?? Math.sqrt((this.prob * (1 - this.prob)) / minTickHistory);
      let conservativeProb = normalizedProb < 0
        ? Math.min(0, normalizedProb + stdDev)
        : Math.max(0, normalizedProb - stdDev);

      return this.vol * conservativeProb;
    },
    absReturn: function () {
      return Math.abs(this.expectedReturn());
    },
    bullish: function () {
      return this.prob > 0.5;
    },
    bearish: function () {
      return !this.bullish();
    },
    ownedShares: function () {
      return this.sharesLong + this.sharesShort;
    },
    owned: function () {
      return this.ownedShares() > 0;
    },
    positionValueLong: function () {
      return this.sharesLong * this.bid_price;
    },
    positionValueShort: function () {
      return this.sharesShort * (2 * this.boughtPriceShort - this.ask_price);
    },
    positionValue: function () {
      return this.positionValueLong() + this.positionValueShort();
    },
    timeToCoverTheSpread: function () {
      return Math.log(this.ask_price / this.bid_price) / Math.log(1 + this.absReturn());
    },
    blackoutWindow: function () {
      return Math.ceil(this.timeToCoverTheSpread());
    },
    priceHistory: [],
    lastInversion: 0
  }));
}
// Chunk 4: Forecasting & Inversion Detection
const forecast = history =>
  history.reduce((ups, price, idx) =>
    idx === 0 ? 0 : (history[idx - 1] > price ? ups + 1 : ups), 0) / (history.length - 1);

const tol2 = inversionDetectionTolerance / 2;
const detectInversion = (p1, p2) =>
  ((p1 >= 0.5 + tol2) && (p2 <= 0.5 - tol2) && p2 <= (1 - p1) + inversionDetectionTolerance) ||
  ((p1 <= 0.5 - tol2) && (p2 >= 0.5 + tol2) && p2 >= (1 - p1) - inversionDetectionTolerance);

// Chunk 5: Refresh Logic
async function refresh(ns, playerStats, allStocks, myStocks, pre4s) {
  const has4s = ns.stock.has4SDataTIXAPI();
  let corpus = playerStats.money;

  const dictAskPrices = getStockInfoDict(ns, ns.stock.getAskPrice);
  const dictBidPrices = getStockInfoDict(ns, ns.stock.getBidPrice);
  const dictVolatilities = !has4s ? null : getStockInfoDict(ns, ns.stock.getVolatility);
  const dictForecasts = !has4s ? null : getStockInfoDict(ns, ns.stock.getForecast);
  const dictPositions = mock ? null : getStockInfoDict(ns, ns.stock.getPosition);

  const ticked = allStocks.some(stk => stk.ask_price !== dictAskPrices[stk.sym]);

  if (ticked) {
    if (Date.now() - lastTick < expectedTickTime - sleepInterval) {
      if (Date.now() - lastTick < catchUpTickTime - sleepInterval) {
        const changedPrices = allStocks.filter(stk => stk.ask_price !== dictAskPrices[stk.sym]);
        ns.print(`WARNING: Detected a stock market tick after only ${formatTime(ns, Date.now() - lastTick)}, but expected ~${formatTime(ns, expectedTickTime)}. ` +
          (changedPrices.length >= 33 ? '(All stocks updated)' :
            `The following ${changedPrices.length} stock prices changed: ${changedPrices.map(stk =>
              `${stk.sym} ${formatMoney(ns, stk.ask_price)} -> ${formatMoney(ns, dictAskPrices[stk.sym])}`).join(', ')}`));
      } else {
        ns.print(`INFO: Detected a rapid stock market tick (${formatTime(ns, Date.now() - lastTick)}), likely to make up for lag / offline time.`);
      }
    }
    lastTick = Date.now();
  }

  myStocks.length = 0;

  for (const stk of allStocks) {
    const sym = stk.sym;
    stk.ask_price = dictAskPrices[sym];
    stk.bid_price = dictBidPrices[sym];
    stk.spread = stk.ask_price - stk.bid_price;
    stk.spread_pct = stk.spread / stk.ask_price;
    stk.price = (stk.ask_price + stk.bid_price) / 2;

    stk.vol = has4s ? dictVolatilities[sym] : stk.vol;
    stk.prob = has4s ? dictForecasts[sym] : stk.prob;
    stk.probStdDev = has4s ? 0 : Math.sqrt((stk.prob * (1 - stk.prob)) / minTickHistory);

    const [priorLong, priorShort] = [stk.sharesLong, stk.sharesShort];
    stk.position = mock ? null : dictPositions[sym];
    stk.sharesLong = mock ? (stk.sharesLong || 0) : stk.position[0];
    stk.boughtPrice = mock ? (stk.boughtPrice || 0) : stk.position[1];
    stk.sharesShort = mock ? (stk.sharesShort || 0) : stk.position[2];
    stk.boughtPriceShort = mock ? (stk.boughtPriceShort || 0) : stk.position[3];

    corpus += stk.positionValue();

    if (stk.owned()) {
      myStocks.push(stk);
    } else {
      stk.ticksHeld = 0;
    }

    if (ticked) {
      stk.ticksHeld = !stk.owned() ||
        (priorLong > 0 && stk.sharesLong === 0) ||
        (priorShort > 0 && stk.sharesShort === 0)
        ? 0 : 1 + (stk.ticksHeld || 0);
    }
  }

  if (ticked) await updateForecast(ns, allStocks, has4s, pre4s);
  return corpus;
}
// Chunk 6: Forecast Update & Inversion Detection

async function updateForecast(ns, allStocks, has4s, pre4s) {
  const currentHistory = allStocks[0].priceHistory.length;
  const prepSummary = mock ||
    (!has4s && (currentHistory < minTickHistory ||
      allStocks.filter(stk => stk.owned()).length === 0));

  const inversionsDetected = [];
  detectedCycleTick = (detectedCycleTick + 1) % marketCycleLength;

  for (const stk of allStocks) {
    if (stk.priceHistory.length >= maxTickHistory) stk.priceHistory.pop();
    stk.priceHistory.unshift(stk.price);

    if (!has4s) {
      stk.prob = forecast(stk.priceHistory.slice(0, minTickHistory));

      stk.vol = stk.priceHistory.reduce((max, price, idx) =>
        Math.max(max, idx === 0 ? 0 : Math.abs(stk.priceHistory[idx - 1] - price) / price), 0);
      if (pre4s) ns.print(`DEBUG: Running in pre-4S mode. Forecasts and volatility are estimated.`);

    }

    stk.nearTermForecast = forecast(stk.priceHistory.slice(0, nearTermForecastWindowLength));
    let preNearTermWindowProb = forecast(stk.priceHistory.slice(nearTermForecastWindowLength));

    stk.possibleInversionDetected = has4s
      ? detectInversion(stk.prob, stk.lastTickProbability || stk.prob)
      : detectInversion(preNearTermWindowProb, stk.nearTermForecast);

    stk.lastTickProbability = stk.prob;

    if (stk.possibleInversionDetected) inversionsDetected.push(stk);
  }

  let summary = '';
  if (inversionsDetected.length > 0) {
    summary += `${inversionsDetected.length} Stocks appear to be reversing their outlook: ${inversionsDetected.map(s => s.sym).join(', ')} (threshold: ${inversionAgreementThreshold})\n`;

    if (inversionsDetected.length >= inversionAgreementThreshold &&
      (has4s || currentHistory >= minTickHistory)) {
      const newPredictedCycleTick = has4s ? 0 : nearTermForecastWindowLength;
      if (detectedCycleTick !== newPredictedCycleTick) {
        ns.print(`Threshold for changing predicted market cycle met (${inversionsDetected.length} >= ${inversionAgreementThreshold}). Changing current market tick from ${detectedCycleTick} to ${newPredictedCycleTick}.`);
      }
      marketCycleDetected = true;
      detectedCycleTick = newPredictedCycleTick;
      inversionAgreementThreshold = Math.max(14, inversionsDetected.length);
    }
  }

  for (const stk of allStocks) {
    if (stk.possibleInversionDetected &&
      ((has4s && detectedCycleTick === 0) ||
        (!has4s && (detectedCycleTick > nearTermForecastWindowLength / 2 - 1 &&
          detectedCycleTick <= nearTermForecastWindowLength + inversionLagTolerance)))) {
      stk.lastInversion = detectedCycleTick;
    } else {
      stk.lastInversion++;
    }

    const probWindowLength = Math.min(longTermForecastWindowLength, stk.lastInversion);
    stk.longTermForecast = forecast(stk.priceHistory.slice(0, probWindowLength));

    if (!has4s) {
      stk.prob = stk.longTermForecast;
      stk.probStdDev = Math.sqrt((stk.prob * (1 - stk.prob)) / probWindowLength);
    }

    const signalStrength = 1 + (stk.bullish()
      ? (stk.nearTermForecast > stk.prob ? 1 : 0) + (stk.prob > 0.8 ? 1 : 0)
      : (stk.nearTermForecast < stk.prob ? 1 : 0) + (stk.prob < 0.2 ? 1 : 0));

    if (prepSummary) {
      stk.debugLog = `${stk.sym.padEnd(5, ' ')} ${(stk.bullish() ? '+' : '-').repeat(signalStrength).padEnd(3)} ` +
        `Prob:${(stk.prob * 100).toFixed(0).padStart(3)}% (t${probWindowLength.toFixed(0).padStart(2)}:${(stk.longTermForecast * 100).toFixed(0).padStart(3)}%, ` +
        `t${Math.min(stk.priceHistory.length, nearTermForecastWindowLength).toFixed(0).padStart(2)}:${(stk.nearTermForecast * 100).toFixed(0).padStart(3)}%) ` +
        `tLastâ‡„:${(stk.lastInversion + 1).toFixed(0).padStart(3)} Vol:${formatPercentage(stk.vol)} ER:${formatMoney(ns, stk.expectedReturn()).padStart(8)} ` +
        `Spread:${formatPercentage(stk.spread_pct)} ttProfit:${stk.blackoutWindow().toFixed(0).padStart(3)}`;

      if (stk.owned()) {
        stk.debugLog += ` Pos: ${formatMoney(ns, stk.ownedShares())} (${stk.ownedShares() === stk.maxShares ? 'max' : formatPercentage(stk.ownedShares() / stk.maxShares)}) ${stk.sharesLong > 0 ? 'long' : 'short'} (held ${stk.ticksHeld} ticks)`;
      }

      if (stk.possibleInversionDetected) stk.debugLog += ' â‡„â‡„â‡„';
    }
  }

  if (prepSummary) {
    summary += `Market day ${detectedCycleTick + 1}${marketCycleDetected ? '' : '?'} of ${marketCycleLength} (${marketCycleDetected ? (100 * inversionAgreementThreshold / 19).toPrecision(2) : '0'}% certain) ` +
      `Current Stock Summary and Pre-4S Forecasts (by best payoff-time):\n` +
      allStocks.sort(purchaseOrder).map(s => s.debugLog).join('\n');
    ns.print(summary);
  }

  const long = [], short = [];
  allStocks.forEach(stk => {
    const symbol = symbolToServer(stk.sym);
    if (symbol) {
      if (stk.sharesLong > 0) long.push(symbol);
      if (stk.sharesShort > 0) short.push(symbol);
    }
  });

  //await modifyFile(ns, portNumber, { long: long, short: short });
}





//Chunk 7: Buy/Sell Logic & HUD Setup


/**
 * Automatically buys either a short or long position depending on the outlook of the stock
 * @param {NS} ns
 * @param {Object} stk
 * @param {number} sharesBought
 * @returns {number} total cost of transaction
 */
async function doBuy(ns, stk, sharesBought) {
  // Validate input
  if (isNaN(sharesBought) || sharesBought <= 0) {
    ns.print(`ERROR: Invalid share count (${sharesBought}) for ${stk.sym}`);
    return 0;
  }

  let long = stk.bullish();
  let expectedPrice = long ? stk.ask_price : stk.bid_price;

  // Validate price
  if (!expectedPrice || isNaN(expectedPrice)) {
    ns.print(`ERROR: Invalid purchase price for ${stk.sym}`);
    return 0;
  }

  // Subtract commission if this is a repeat purchase
  if (stk.owned()) totalProfit -= commission;

  let price;
  try {
    price = mock
      ? expectedPrice
      : long
        ? await ns.stock.buyStock(stk.sym, sharesBought)
        : await ns.stock.buyShort(stk.sym, sharesBought);
  } catch (err) {
    if (long) throw err;
    printBoth(ns, `WARNING: Failed to short ${stk.sym} (Shorts not available?). Disabling shorts...`);
    disableShorts = true;
    return 0;
  }

  // Format values before logging to avoid concurrency errors
  const formattedPrice = price.toFixed(2);
  const formattedTotal = (sharesBought * price).toFixed(2);
  await logTrade(ns, `Bought ${sharesBought} ${stk.sym} @ ${formattedPrice} for ${formattedTotal}`);

  ns.print(`INFO: ${long ? 'Bought' : 'Shorted'} ${sharesBought}${stk.maxShares === sharesBought + stk.ownedShares() ? ' (max shares)' : ''} ` +
    `${stk.sym.padEnd(5)} @ ${formattedPrice} for ${formattedTotal} (Spread: ${formatPercentage(stk.spread_pct)} ` +
    `ER:${stk.expectedReturn()}) Ticks to Profit: ${stk.timeToCoverTheSpread().toFixed(2)}`);

  // Handle known Bitburner bug: returned price may be incorrect
  if (price === 0) {
    printBoth(ns, `ERROR: Failed to ${long ? 'buy' : 'short'} ${stk.sym} @ ${formattedPrice} - 0 was returned`);
    return 0;
  } else if (price !== expectedPrice) {
    printBoth(ns, `WARNING: ${long ? 'Bought' : 'Shorted'} ${stk.sym} @ ${price} but expected ${formattedPrice} (spread: ${stk.spread})`);
    price = expectedPrice;
  }

  // Update mock-mode tracking
  if (mock && long)
    stk.boughtPrice = (stk.boughtPrice * stk.sharesLong + price * sharesBought) / (stk.sharesLong + sharesBought);
  if (mock && !long)
    stk.boughtPriceShort = (stk.boughtPriceShort * stk.sharesShort + price * sharesBought) / (stk.sharesShort + sharesBought);

  // Update share counts (mock mode only)
  if (long) stk.sharesLong += sharesBought;
  else stk.sharesShort += sharesBought;

  return sharesBought * price + commission;
}



/**
 * Sell our current position in this stock
 * @param {NS} ns
 * @param {Object} stk
 * @returns {number}
 */
async function doSellAll(ns, stk) {
  let long = stk.sharesLong > 0;

  if (long && stk.sharesShort > 0) {
    printBoth(ns, `ERROR: Somehow ended up both ${stk.sharesShort} short and ${stk.sharesLong} long on ${stk.sym}`);
  }

  let expectedPrice = long ? stk.bid_price : stk.ask_price;
  let sharesSold = long ? stk.sharesLong : stk.sharesShort;

  let price = mock
    ? expectedPrice
    : long
      ? await ns.stock.sellStock(stk.sym, sharesSold)
      : await ns.stock.sellShort(stk.sym, sharesSold);

  const profit = (long
    ? stk.sharesLong * (price - stk.boughtPrice)
    : stk.sharesShort * (stk.boughtPriceShort - price)) - 2 * commission;

  // Format values before logging
  const formattedPrice = price;
  const formattedTotal = (sharesSold * price);


  //logTrade(ns, `${profit > 0 ? 'PROFIT' : 'LOSS'}: Sold ${sharesSold} ${stk.sym} @ ${format_compact_currency(price)} for ${(sharesSold * price).toFixed(2)} after ${stk.ticksHeld} ticks`);

  //await ns.print(`${profit > 0 ? 'SUCCESS' : 'WARNING'}: Sold all ${sharesSold.toString().padStart(5)} ${stk.sym.padEnd(5)} ${long ? ' long' : 'short'} positions ` +
  //  `@ ${format_compact_currency(price)} for a ${profit > 0 ? `PROFIT of ${profit.toFixed(2).padStart(9)}` : `LOSS of ${(-profit).toFixed(2).padStart(9)}`} after ${stk.ticksHeld} ticks`);

  if (price === 0) {
    printBoth(ns, `ERROR: Failed to sell ${sharesSold} ${stk.sym} ${long ? 'shares' : 'shorts'} @ ${format_compact_currency(price)} - 0 was returned`);
    return 0;
  } else if (price !== expectedPrice) {
    ns.print(`WARNING: Sold ${stk.sym} ${long ? 'shares' : 'shorts'} @ ${format_compact_currency(price)} but expected ${format_compact_currency(expectedPrice)} (spread: ${stk.spread.toFixed(2)})`);
    price = expectedPrice;
  }

  if (long) stk.sharesLong -= sharesSold;
  else stk.sharesShort -= sharesSold;

  totalProfit += profit;
  return price * sharesSold - commission;
}



async function logTrade(ns, message) {
  ns.write('/logs/trade-log.txt', message + '\n', 'a');
}


function initializeHud(ns) {
  const d = eval('document');
  let htmlDisplay = d.getElementById('stock-display-1');
  if (htmlDisplay !== null) return htmlDisplay;

  let customElements = d.getElementById('overview-extra-hook-0').parentElement.parentElement;
  let stockValueTracker = customElements.cloneNode(true);

  stockValueTracker.querySelectorAll('p > p').forEach(e => e.parentElement.removeChild(e));
  stockValueTracker.querySelectorAll('p').forEach((e, i) => e.id = `stock-display-${i}`);

  htmlDisplay = stockValueTracker.querySelector('#stock-display-1');
  stockValueTracker.querySelectorAll('p')[0].innerText = 'Stock';
  htmlDisplay.innerText = '$0.000 ';

  customElements.parentElement.insertBefore(stockValueTracker, customElements.parentElement.childNodes[2]);
  return htmlDisplay;
}


function doStatusUpdate(ns, stocks, myStocks, hudElement = null) {
  const maxReturnBP = 1e5 * Math.max(...myStocks.map(s => s.absReturn()));
  const minReturnBP = 1e5 * Math.min(...myStocks.map(s => s.absReturn()));
  const est_holdings_cost = myStocks.reduce((sum, stk) =>
    sum + (stk.owned() ? commission : 0) +
    stk.sharesLong * stk.boughtPrice +
    stk.sharesShort * stk.boughtPriceShort, 0);
  const liquidation_value = myStocks.reduce((sum, stk) =>
    sum - (stk.owned() ? commission : 0) + stk.positionValue(), 0);


  ns.print(`Long ${myStocks.filter(s => s.sharesLong > 0).length}, Short ${myStocks.filter(s => s.sharesShort > 0).length} of ${stocks.length} stocks ` +
    (myStocks.length === 0 ? '' : `(ER ${format_compact_currency(minReturnBP)}-${format_compact_currency(maxReturnBP)} BP) `) +
    `Profit: ${format_compact_currency(totalProfit)} Holdings: ${format_compact_currency(liquidation_value)} ` +
    `(Cost: ${format_compact_currency(est_holdings_cost)}) Net: ${(totalProfit + liquidation_value - est_holdings_cost).toFixed(2)})`);

  if (hudElement) hudElement.innerText = format_compact_currency(liquidation_value);
}

function tryGet4SApi(ns, playerStats, bitnodeMults, corpus) {
    const baseCost = 1e9 + 5e9; // 1B for 4S Market Data, 5B for 4S Market Data TIX API
    const discount = bitnodeMults.FourSigmaMarketDataApiCost * bitnodeMults.FourSigmaMarketDataCost;
    const adjustedCost = baseCost * discount;

    if (corpus > adjustedCost) {
        ns.print(`INFO: Buying 4S Market Data API for $${formatMoney(adjustedCost)}...`);
        ns.stock.purchase4SMarketData();
        ns.stock.purchase4SMarketDataTixApi();
        return true;
    }
    return false;
}


